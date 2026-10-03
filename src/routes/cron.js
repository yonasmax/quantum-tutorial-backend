const express = require('express');
const router = express.Router();
const {
  processPendingReminders,
} = require('../services/reminderService');
const {
  scanExamReminders,
  scanTeacherReviewReminders,
  scanReEngagement,
} = require('../services/reminderScanner');
const {
  isSubscriptionActive,
  expireSubscription,
  sendExpiryReminder,
  getDaysRemaining,
} = require('../services/subscriptionService');
const User = require('../models/User');

// ================================================================
// HELPER — Check subscriptions: remind + expire
// ================================================================
const checkSubscriptions = async () => {
  const results = { reminded7: 0, reminded3: 0, expired: 0 };

  const users = await User.find({
    role: 'student',
    'subscription.isActive': true,
  });

  for (const user of users) {
    const daysLeft = getDaysRemaining(user);

    if (daysLeft === 7) {
      await sendExpiryReminder(user, 7);
      results.reminded7++;
    }

    if (daysLeft === 3) {
      await sendExpiryReminder(user, 3);
      results.reminded3++;
    }

    if (daysLeft === 0 || !isSubscriptionActive(user)) {
      await expireSubscription(user._id);
      results.expired++;
    }
  }

  return results;
};

// ================================================================
// GET /api/cron/daily
// ================================================================
router.get('/daily', async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('⏰ Cron started:', new Date().toISOString());

    const scanResults = {
      exams: await scanExamReminders(),
      teacherReviews: await scanTeacherReviewReminders(),
      reEngagement: await scanReEngagement(),
      subscriptions: await checkSubscriptions(),
    };

    const processResults = await processPendingReminders(100);

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      scan: scanResults,
      process: processResults,
    };

    console.log('✅ Cron finished:', JSON.stringify(summary));
    res.json(summary);
  } catch (err) {
    console.error('❌ Cron error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/cron/status
// ================================================================
router.get('/status', async (req, res) => {
  try {
    const Reminder = require('../models/Reminder');
    const [pending, sent, failed, cancelled] = await Promise.all([
      Reminder.countDocuments({ status: 'pending' }),
      Reminder.countDocuments({ status: 'sent' }),
      Reminder.countDocuments({ status: 'failed' }),
      Reminder.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      success: true,
      queue: { pending, sent, failed, cancelled },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;