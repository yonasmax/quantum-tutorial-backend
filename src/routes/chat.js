const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const SubjectAssignment = require('../models/SubjectAssignment');
const { protect } = require('../middleware/auth');

// ================================================================
// GET /api/chat/conversations — my inbox
// ================================================================
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
      [`deletedFor.${req.user._id}`]: { $exists: false },
    })
      .populate('participantsInfo.user', 'fullName role grade')
      .sort({ lastActivityAt: -1 })
      .limit(50);

    // Add unread count for current user
    const enriched = conversations.map((c) => {
      const other = c.participantsInfo.find(
        (p) => String(p.user?._id) !== String(req.user._id)
      );
      const unread = c.unreadCount?.get(String(req.user._id)) || 0;
      return {
        _id: c._id,
        other: other
          ? {
              _id: other.user?._id,
              fullName: other.user?.fullName || other.fullName,
              role: other.user?.role || other.role,
              grade: other.user?.grade,
            }
          : null,
        lastMessage: c.lastMessage,
        unread,
        lastActivityAt: c.lastActivityAt,
        subject: c.subject,
        grade: c.grade,
      };
    });

    const totalUnread = enriched.reduce((s, c) => s + c.unread, 0);

    res.json({ success: true, totalUnread, conversations: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/chat/conversations — start a new conversation
// Body: { recipientId }
// ================================================================
router.post('/conversations', protect, async (req, res) => {
  try {
    const { recipientId, subject, grade } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }

    if (String(recipientId) === String(req.user._id)) {
      return res
        .status(400)
        .json({ error: 'You cannot start a chat with yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Role-based check: student can chat with teacher, teacher with student
    const allowedPairs = [
      ['student', 'teacher'],
      ['teacher', 'student'],
      ['teacher', 'admin'],
      ['admin', 'teacher'],
      ['student', 'admin'],
      ['admin', 'student'],
      ['teacher', 'teacher'],
      ['student', 'student'], // allow student-to-student? Change if not desired
    ];
    const pair = [req.user.role, recipient.role];
    const isAllowed = allowedPairs.some(
      ([a, b]) => a === pair[0] && b === pair[1]
    );

    if (!isAllowed) {
      return res.status(403).json({
        error: `Chat between ${req.user.role} and ${recipient.role} is not allowed`,
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findBetween(
      req.user._id,
      recipient._id
    );

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipient._id],
        participantsInfo: [
          {
            user: req.user._id,
            fullName: req.user.fullName,
            role: req.user.role,
          },
          {
            user: recipient._id,
            fullName: recipient.fullName,
            role: recipient.role,
          },
        ],
        subject: subject || '',
        grade: grade || '',
      });
    }

    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/chat/conversations/:id/messages
// ================================================================
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const messages = await Message.find({
      conversation: conversation._id,
      deleted: false,
    })
      .sort({ createdAt: 1 })
      .limit(200);

    // Mark as read
    const unread = conversation.unreadCount || new Map();
    unread.set(String(req.user._id), 0);
    conversation.unreadCount = unread;
    await conversation.save();

    // Add current user to readBy for all messages
    await Message.updateMany(
      {
        conversation: conversation._id,
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: { user: req.user._id, readAt: new Date() },
        },
      }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/chat/conversations/:id/messages — send a message
// ================================================================
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { text, attachment } = req.body;

    if (!text && !attachment?.url) {
      return res.status(400).json({ error: 'Message text or attachment required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      senderName: req.user.fullName,
      senderRole: req.user.role,
      text: text || '',
      attachment: attachment || undefined,
    });

    // Update conversation
    const unread = conversation.unreadCount || new Map();
    for (const p of conversation.participants) {
      const key = String(p);
      if (key === String(req.user._id)) continue;
      unread.set(key, (unread.get(key) || 0) + 1);
    }
    conversation.unreadCount = unread;
    conversation.lastMessage = {
      text: text || '',
      sender: req.user._id,
      senderName: req.user.fullName,
      sentAt: new Date(),
      hasAttachment: !!attachment?.url,
    };
    conversation.lastActivityAt = new Date();
    await conversation.save();

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/chat/conversations/:id/read — mark as read
// ================================================================
router.put('/conversations/:id/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const unread = conversation.unreadCount || new Map();
    unread.set(String(req.user._id), 0);
    conversation.unreadCount = unread;
    await conversation.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// DELETE /api/chat/conversations/:id — soft delete for me
// ================================================================
router.delete('/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const deletedFor = conversation.deletedFor || new Map();
    deletedFor.set(String(req.user._id), new Date());
    conversation.deletedFor = deletedFor;
    await conversation.save();

    res.json({ success: true, message: 'Conversation hidden' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/chat/unread-count — total unread (for sidebar badge)
// ================================================================
router.get('/unread-count', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    });

    let total = 0;
    for (const c of conversations) {
      total += c.unreadCount?.get(String(req.user._id)) || 0;
    }

    res.json({ success: true, unread: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/chat/contacts — who can I chat with?
// ================================================================
router.get('/contacts', protect, async (req, res) => {
  try {
    let contacts = [];

    if (req.user.role === 'student') {
      // Students → teachers assigned to their grade
      const assignments = await SubjectAssignment.find({
        grade: String(req.user.grade),
        isActive: true,
      }).distinct('teacher');

      contacts = await User.find({
        _id: { $in: assignments },
        role: 'teacher',
        status: 'active',
      }).select('fullName email role grade');
    } else if (req.user.role === 'teacher') {
      // Teachers → students in their assigned grades
      const myAssignments = await SubjectAssignment.find({
        teacher: req.user._id,
        isActive: true,
      });

      const grades = [...new Set(myAssignments.map((a) => a.grade))];

      contacts = await User.find({
        role: 'student',
        status: 'active',
        grade: { $in: grades },
      })
        .select('fullName email role grade')
        .limit(200);
    } else if (req.user.role === 'admin') {
      // Admin → everyone
      contacts = await User.find({
        _id: { $ne: req.user._id },
        status: 'active',
      })
        .select('fullName email role grade')
        .limit(200);
    }

    res.json({ success: true, count: contacts.length, contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;