const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createAndSend } = require('../services/reminderService');

// ================================================================
// GET /api/reminders/me — list my reminders (recent + upcoming)
// ================================================================
router.get('/me', protect, async (req, res) => {
  try {
    const recent = await Reminder.find({
      recipient: req.user._id,
      status: 'sent',
    })
      .sort({ sentAt: -1 })
      .limit(20);

    const upcoming = await Reminder.find({
      recipient: req.user._id,
      status: 'pending',
    })
      .sort({ scheduledFor: 1 })
      .limit(20);

    res.json({
      success: true,
      recent,
      upcoming,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/reminders/preferences
// ================================================================
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'reminderPreferences'
    );
    res.json({
      success: true,
      preferences: user.reminderPreferences || {},
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/reminders/preferences
// ================================================================
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.reminderPreferences) {
      user.reminderPreferences = {};
    }

    const allowed = [
      'examUpcoming',
      'examDeadline',
      'lessonReview',
      'contentReminder',
      'feeDue',
      'subscriptionExpiring',
      'reEngagement',
    ];

    for (const key of allowed) {
      if (typeof req.body[key] === 'boolean') {
        user.reminderPreferences[key] = req.body[key];
      }
    }

    await user.save();
    res.json({
      success: true,
      preferences: user.reminderPreferences,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/reminders/send — admin sends manual reminder
// ================================================================
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { recipientId, subject, title, body } = req.body;

    if (!recipientId || !subject || !title || !body) {
      return res.status(400).json({
        error: 'recipientId, subject, title, and body are required',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const reminder = await createAndSend({
      recipient,
      type: 'custom',
      subject,
      title,
      body,
    });

    res.json({ success: true, reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/reminders/admin/all — admin views all reminders
// ================================================================
router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { status, type, limit = 100 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const reminders = await Reminder.find(filter)
        .populate('recipient', 'fullName email role')
        .sort({ scheduledFor: -1 })
        .limit(parseInt(limit, 10));

      const counts = {
        pending: await Reminder.countDocuments({ status: 'pending' }),
        sent: await Reminder.countDocuments({ status: 'sent' }),
        failed: await Reminder.countDocuments({ status: 'failed' }),
        cancelled: await Reminder.countDocuments({ status: 'cancelled' }),
      };

      res.json({ success: true, count: reminders.length, counts, reminders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;