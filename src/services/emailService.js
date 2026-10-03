// ═══════════════════════════════════════════════════
// Brevo Email Service — uses direct REST API (no SDK)
// ═══════════════════════════════════════════════════

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_NAME = 'Quantum Center of Intellect';
const SENDER_EMAIL = 'yonasmolla3@gmail.com';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ═══════════════════════════════════════════════════
// CORE SEND FUNCTION
// ═══════════════════════════════════════════════════
const sendEmail = async ({ to, subject, htmlContent }) => {
  if (!BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API error:', data);
      return { success: false, error: data.message || 'Email send failed' };
    }

    console.log(`✅ Email sent to ${to} (messageId: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error('❌ Email send exception:', err.message);
    return { success: false, error: err.message };
  }
};

// ═══════════════════════════════════════════════════
// SHARED HTML TEMPLATE WRAPPER
// ═══════════════════════════════════════════════════
const wrapHtml = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #fdfaf6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 2px solid #d4af37; }
    .header { background: linear-gradient(135deg, #8e1616 0%, #4a0000 100%); padding: 24px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { color: #ffd700; margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { color: #ffffff; margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 32px 28px; color: #1a1a1a; line-height: 1.7; }
    .body h2 { color: #8e1616; margin-top: 0; font-size: 20px; }
    .body p { margin: 12px 0; font-size: 15px; }
    .button { display: inline-block; background: linear-gradient(135deg, #8e1616, #4a0000); color: #ffd700 !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; margin: 16px 0; border: 2px solid #d4af37; }
    .highlight { background: #fff8e1; border-left: 4px solid #d4af37; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .footer { background: #fdfaf6; padding: 20px; text-align: center; border-top: 2px solid rgba(212, 175, 55, 0.3); }
    .footer p { color: #8e1616; margin: 4px 0; font-size: 13px; font-weight: 700; }
    .footer small { color: #888; font-size: 11px; }
    .crosses { color: #d4af37; font-size: 16px; letter-spacing: 6px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QUANTUM CENTER OF INTELLECT</h1>
      <p>• Master the Quantum Realm •</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      <p class="crosses">☦ ⳩ ☩ ✠ ⳩ ☦</p>
      <p>Quantum Center of Intellect</p>
      <small>This is an automated message. Please do not reply.</small>
    </div>
  </div>
</body>
</html>
`;

// ═══════════════════════════════════════════════════
// TEMPLATE 1 — ENTRANCE EXAM PASSED
// ═══════════════════════════════════════════════════
const sendEntranceExamPassed = async (student, exam, score) => {
  const subject = `🎉 You passed the ${exam.subject} Entrance Exam!`;

  const html = wrapHtml(
    `Congratulations, ${student.fullName}! 🎓`,
    `
    <p>You've successfully passed the <strong>${exam.title}</strong>.</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>Your Score:</strong> ${score}%</p>
      <p style="margin: 6px 0 0 0;"><strong>Subject:</strong> ${exam.subject}</p>
      <p style="margin: 6px 0 0 0;"><strong>Grade:</strong> ${exam.grade}</p>
    </div>

    <p>🎉 <strong>Big news:</strong> You've now unlocked the <strong>Model Exam</strong>! This is your chance to practice with full-length, timed exams that mirror the real national exam.</p>

    <p>Log in to your dashboard and look for the <strong>🎓 Model Exam</strong> card.</p>

    <a href="https://quantum-tutorial.vercel.app/dashboard" class="button">Go to Dashboard →</a>

    <p style="margin-top: 24px; color: #666; font-size: 14px;">Keep up the excellent work. Your dedication will pay off.</p>
    `
  );

  return sendEmail({ to: student.email, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════
// TEMPLATE 2 — MODEL EXAM UNLOCKED
// ═══════════════════════════════════════════════════
const sendModelExamUnlocked = async (student, exam) => {
  const subject = `🔓 Your Model Exam is now unlocked!`;

  const html = wrapHtml(
    `New Model Exam Available 🎓`,
    `
    <p>Hi ${student.fullName},</p>
    <p>A new model exam is now available for you to take:</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>📋 ${exam.title}</strong></p>
      <p style="margin: 6px 0 0 0;">Subject: ${exam.subject}</p>
      <p style="margin: 6px 0 0 0;">Duration: ${exam.duration} minutes</p>
      <p style="margin: 6px 0 0 0;">Marks: ${exam.totalMarks}</p>
    </div>

    <p>This is a full-length practice exam — timed and auto-graded, just like the real one.</p>

    <a href="https://quantum-tutorial.vercel.app/dashboard" class="button">Start Model Exam →</a>
    `
  );

  return sendEmail({ to: student.email, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════
// TEMPLATE 3 — EXAM RESULT NOTIFICATION
// ═══════════════════════════════════════════════════
const sendExamResult = async (student, exam, result) => {
  const passed = result.percentage >= exam.passingMarks;
  const subject = passed
    ? `✅ You passed: ${exam.title}`
    : `📚 Result for ${exam.title}`;

  const html = wrapHtml(
    passed ? 'Congratulations! 🎉' : 'Your Exam Result 📊',
    `
    <p>Hi ${student.fullName},</p>
    <p>Your result for <strong>${exam.title}</strong> is ready:</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>Score:</strong> ${result.obtainedMarks} / ${result.totalMarks}</p>
      <p style="margin: 6px 0 0 0;"><strong>Percentage:</strong> ${result.percentage}%</p>
      <p style="margin: 6px 0 0 0;"><strong>Status:</strong> ${passed ? '✅ PASSED' : '❌ Not passed'}</p>
    </div>

    ${
      passed
        ? '<p>Excellent work! Keep up the momentum. 🚀</p>'
        : '<p>Don\'t be discouraged — review your answers and try again. Every attempt makes you stronger. 💪</p>'
    }

    <a href="https://quantum-tutorial.vercel.app/progress" class="button">View Full Progress →</a>
    `
  );

  return sendEmail({ to: student.email, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════
// TEMPLATE 4 — TEST EMAIL
// ═══════════════════════════════════════════════════
const sendTestEmail = async (to) => {
  const html = wrapHtml(
    'Test Email ✅',
    `
    <p>Hi there,</p>
    <p>This is a test email from <strong>Quantum Center of Intellect</strong>.</p>

    <div class="highlight">
      <p style="margin: 0;">✅ Brevo integration working</p>
      <p style="margin: 6px 0 0 0;">✅ API key valid</p>
      <p style="margin: 6px 0 0 0;">✅ Sender verified</p>
    </div>

    <p>Timestamp: ${new Date().toISOString()}</p>
    <p>🎉 You can now send real notification emails to students.</p>
    `
  );

  return sendEmail({
    to,
    subject: '✅ Test email from Quantum Center of Intellect',
    htmlContent: html,
  });
};
// ═══════════════════════════════════════════════════════════════
// TEMPLATE 5 — NEW REGISTRATION ALERT (to admin)
// ═══════════════════════════════════════════════════════════════
const sendNewRegistrationAlert = async (newUser) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'yonasmolla3@gmail.com';
  const subject = `🔔 New registration: ${newUser.fullName}`;

  const html = wrapHtml(
    `New Registration Pending Approval`,
    `
    <p>A new user has registered and is waiting for your approval:</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>👤 Name:</strong> ${newUser.fullName}</p>
      <p style="margin: 6px 0 0 0;"><strong>📧 Email:</strong> ${newUser.email}</p>
      <p style="margin: 6px 0 0 0;"><strong>🎭 Role:</strong> ${newUser.role}</p>
      ${newUser.grade ? `<p style="margin: 6px 0 0 0;"><strong>📚 Grade:</strong> ${newUser.grade}</p>` : ''}
      ${newUser.phone ? `<p style="margin: 6px 0 0 0;"><strong>📞 Phone:</strong> ${newUser.phone}</p>` : ''}
      <p style="margin: 6px 0 0 0;"><strong>🕐 Registered:</strong> ${new Date(newUser.createdAt).toLocaleString()}</p>
    </div>

    <p>Log in to the admin dashboard to approve or reject this user.</p>

    <a href="https://quantum-tutorial.vercel.app/admin/pending-users" class="button">Review in Admin Dashboard →</a>
    `
  );

  return sendEmail({ to: adminEmail, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 6 — ACCOUNT APPROVED (to user)
// ═══════════════════════════════════════════════════════════════
const sendAccountApproved = async (user) => {
  const subject = `✅ Your account has been approved!`;

  const html = wrapHtml(
    `Welcome aboard, ${user.fullName}! 🎉`,
    `
    <p>Great news — your registration has been reviewed and <strong>approved</strong>!</p>

    <div class="highlight">
      <p style="margin: 0;">✅ Your account is now <strong>active</strong></p>
      <p style="margin: 6px 0 0 0;">📧 Email: ${user.email}</p>
    </div>

    <p>You can now log in and start using Quantum Center of Intellect:</p>

    <a href="https://quantum-tutorial.vercel.app/login" class="button">Log In Now →</a>

    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Welcome to the community. We're excited to have you!
    </p>
    `
  );

  return sendEmail({ to: user.email, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 7 — ACCOUNT REJECTED (to user)
// ═══════════════════════════════════════════════════════════════
const sendAccountRejected = async (user, reason) => {
  const subject = `Update on your registration`;

  const html = wrapHtml(
    `Registration Update`,
    `
    <p>Hi ${user.fullName},</p>

    <p>Thank you for your interest in Quantum Center of Intellect. After review, we're unable to approve your registration at this time.</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>Reason:</strong></p>
      <p style="margin: 6px 0 0 0;">${reason}</p>
    </div>

    <p>If you believe this is a mistake, please contact the administration.</p>
    `
  );

  return sendEmail({ to: user.email, subject, htmlContent: html });
};
// ═══════════════════════════════════════════════════════════════
// TEMPLATE 8 — TEACHER WELCOME (admin-created)
// ═══════════════════════════════════════════════════════════════
const sendTeacherWelcome = async (teacher, plainPassword, assignments = []) => {
  const subject = `🎓 Welcome to Quantum Center of Intellect — Your Account is Ready`;

  const assignmentList = assignments
    .map((a) => `<li><strong>${a.subject}</strong> — Grade ${a.grade}</li>`)
    .join('');

  const html = wrapHtml(
    `Welcome, ${teacher.fullName}! 🎓`,
    `
    <p>An administrator at <strong>Quantum Center of Intellect</strong> has created an account for you.</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>📧 Email:</strong> ${teacher.email}</p>
      <p style="margin: 6px 0 0 0;"><strong>🔑 Password:</strong> <code style="background:#fff; padding:2px 8px; border-radius:4px; border:1px solid #d4af37;">${plainPassword}</code></p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #b06000;">⚠️ Please change this password after your first login.</p>
    </div>

    ${
      assignments.length > 0
        ? `
      <p><strong>You have been assigned to teach:</strong></p>
      <ul style="line-height: 1.8;">
        ${assignmentList}
      </ul>
    `
        : ''
    }

    <p>Log in to access your courses, create lessons, build quizzes, and manage your students.</p>

    <a href="https://quantum-tutorial.vercel.app/login" class="button">Log In Now →</a>
    `
  );

  return sendEmail({ to: teacher.email, subject, htmlContent: html });
};

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 9 — PASSWORD RESET
// ═══════════════════════════════════════════════════════════════
const sendPasswordReset = async (user, plainPassword) => {
  const subject = `🔑 Your password has been reset`;

  const html = wrapHtml(
    `Password Reset`,
    `
    <p>Hi ${user.fullName},</p>
    <p>An administrator has reset your password. Your new credentials are:</p>

    <div class="highlight">
      <p style="margin: 0;"><strong>📧 Email:</strong> ${user.email}</p>
      <p style="margin: 6px 0 0 0;"><strong>🔑 New Password:</strong> <code style="background:#fff; padding:2px 8px; border-radius:4px; border:1px solid #d4af37;">${plainPassword}</code></p>
    </div>

    <p>Log in with these credentials, then change your password in the settings.</p>

    <a href="https://quantum-tutorial.vercel.app/login" class="button">Log In →</a>
    `
  );

  return sendEmail({ to: user.email, subject, htmlContent: html });
};
module.exports = {
  sendEmail,
  sendEntranceExamPassed,
  sendModelExamUnlocked,
  sendExamResult,
  sendTestEmail,
  sendNewRegistrationAlert,
  sendAccountApproved,
  sendAccountRejected,
};