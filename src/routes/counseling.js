const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const CounselingSession = require('../models/CounselingSession');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// Request counseling session
router.post('/request', protect, async (req, res) => {
  try {
    const { sessionType, title, description, isAnonymous, preferredDate, preferredTime, urgency } = req.body;

    const session = await CounselingSession.create({
      student: req.user._id,
      sessionType: sessionType || 'individual',
      title,
      description,
      isAnonymous: isAnonymous || false,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime,
      urgency: urgency || 'medium',
      status: 'pending'
    });

    // Notify counselors
    const counselors = await User.find({ role: 'counselor' });
    for (const counselor of counselors) {
      await sendEmail({
        to: counselor.email,
        subject: '🆕 New Counseling Request',
        html: `
          <h2>New Counseling Request</h2>
          <p><strong>Type:</strong> ${sessionType}</p>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Urgency:</strong> ${urgency}</p>
          <p><strong>Student:</strong> ${isAnonymous ? 'Anonymous' : req.user.fullName}</p>
          <p><strong>Description:</strong> ${description}</p>
        `
      });
    }

    res.status(201).json({
      success: true,
      message: 'Counseling request submitted',
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's sessions
router.get('/my', protect, async (req, res) => {
  try {
    const sessions = await CounselingSession.find({ student: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions
router.get('/all', protect, authorize('admin', 'counselor'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const sessions = await CounselingSession.find(query)
      .populate('student', 'fullName email phone grade')
      .populate('counselor', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;