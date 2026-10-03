const Reminder = require('../models/Reminder');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Lesson = require('../models/Lesson');
const { sendEmail } = require('./emailService');

// ================================================================
// EMAIL TEMPLATE — shared wrapper
// ================================================================
const emailWrapper = (title, bodyHtml, ctaText, ctaUrl) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf6; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #7a3d10 0%, #974F18 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff8e7; margin: 0; font-size: 22px;">Quantum Center of Intellect</h1>
      <p style="color: #d4af37; margin: 6px 0 0 0; font-size: 14px; letter-spacing: 2px;">MASTER THE QUANTUM REALM</p>
    </div>
    <div style="background: #fff8e7; padding: 30px; border-radius: 0 0 12px 12px; border: 2px solid #d4af37; border-top: none;">
      <h2 style="color: #5a2e0a; margin-top: 0;">${title}</h2>
      <div style="color: #3a2410; font-size: 15px; line-height: 1.7;">
        ${bodyHtml}
      </div>
      ${
        ctaText && ctaUrl
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #974F18, #5a2e0a); color: #fff8e7; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; border: 2px solid #d4af37;">
            ${ctaText}
          </a>
        </div>
      `
          : ''
      }
      <hr style="border: none; border-top: 1px solid #d4af37; margin: 24px 0;" />
      <p style="color: #7a5a3a; font-size: 12px; text-align: center;">
        You're receiving this because you have reminders enabled.
        <a href="${
          process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app'
        }/profile" style="color: #974F18;">Manage preferences</a>
      </p>
      <p style="color: #7a5a3a; font-size: 12px; text-align: center; margin-top: 8px;">
        © ${new Date().getFullYear()} Quantum Center of Intellect — Made in Ethiopia 🇪🇹
      </p>
    </div>
  </div>
`;

// ================================================================
// CREATE + SEND a reminder immediately
// ================================================================
const createAndSend = async ({
  recipient,
  type,
  subject,
  title,
  body,
  ctaText,
  ctaUrl,
  relatedId,
  relatedModel,
}) => {
  try {
    const html = emailWrapper(title, body, ctaText, ctaUrl);
    const result = await sendEmail({
      to: recipient.email,
      subject,
      htmlContent: html,
    });

    const reminder = await Reminder.create({
      recipient: recipient._id,
      recipientEmail: recipient.email,
      recipientRole: recipient.role,
      type,
      relatedId,
      relatedModel,
      subject,
      title,
      body,
      scheduledFor: new Date(),
      sentAt: new Date(),
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.success ? null : result.error,
      attempts: 1,
    });

    return reminder;
  } catch (err) {
    console.error('createAndSend error:', err.message);
    throw err;
  }
};

// ================================================================
// SCHEDULE a reminder for later
// ================================================================
const scheduleReminder = async ({
  recipient,
  type,
  subject,
  title,
  body,
  scheduledFor,
  relatedId,
  relatedModel,
}) => {
  return Reminder.create({
    recipient: recipient._id,
    recipientEmail: recipient.email,
    recipientRole: recipient.role,
    type,
    relatedId,
    relatedModel,
    subject,
    title,
    body,
    scheduledFor,
    status: 'pending',
  });
};

// ================================================================
// PROCESS PENDING REMINDERS — called by cron
// ================================================================
const processPendingReminders = async (limit = 50) => {
  const now = new Date();
  const pending = await Reminder.find({
    status: 'pending',
    scheduledFor: { $lte: now },
  })
    .limit(limit)
    .sort({ scheduledFor: 1 });

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const reminder of pending) {
    try {
      // Check user preferences
      const user = await User.findById(reminder.recipient);
      if (!user) {
        reminder.status = 'cancelled';
        reminder.errorMessage = 'User no longer exists';
        await reminder.save();
        results.skipped++;
        continue;
      }

      const prefMap = {
        'exam-upcoming': 'examUpcoming',
        'exam-deadline': 'examDeadline',
        'lesson-review': 'lessonReview',
        'content-reminder': 'contentReminder',
        'fee-due': 'feeDue',
        'subscription-expiring': 'subscriptionExpiring',
        're-engagement': 'reEngagement',
      };
      const prefKey = prefMap[reminder.type];

      if (
        prefKey &&
        user.reminderPreferences &&
        user.reminderPreferences[prefKey] === false
      ) {
        reminder.status = 'cancelled';
        reminder.errorMessage = 'User disabled this reminder type';
        await reminder.save();
        results.skipped++;
        continue;
      }

      // Send it
      const result = await sendEmail({
        to: reminder.recipientEmail,
        subject: reminder.subject,
        htmlContent: emailWrapper(
          reminder.title,
          reminder.body,
          null,
          null
        ),
      });

      reminder.sentAt = new Date();
      reminder.attempts = (reminder.attempts || 0) + 1;
      reminder.status = result.success ? 'sent' : 'failed';
      reminder.errorMessage = result.success ? null : result.error;
      await reminder.save();

      if (result.success) results.sent++;
      else results.failed++;
    } catch (err) {
      reminder.status = 'failed';
      reminder.errorMessage = err.message;
      reminder.attempts = (reminder.attempts || 0) + 1;
      await reminder.save();
      results.failed++;
    }
  }

  return results;
};

module.exports = {
  createAndSend,
  scheduleReminder,
  processPendingReminders,
};