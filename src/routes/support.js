const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

// ================================================================
// CREATE A SUPPORT TICKET (public — no login required)
// ================================================================
router.post('/ticket', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      category,
      subject,
      message,
      priority,
      pageUrl,
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Name, email, subject, and message are required',
      });
    }

    if (message.length < 10) {
      return res
        .status(400)
        .json({ error: 'Please provide more detail (at least 10 characters)' });
    }

    // Attach user if logged in
    let userId = null;
    let userRole = 'guest';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
        const u = await User.findById(userId);
        if (u) userRole = u.role;
      } catch (e) {
        // Invalid token — proceed as guest
      }
    }

    const ticket = await SupportTicket.create({
      user: userId,
      name,
      email,
      phone: phone || '',
      role: userRole,
      category: category || 'other',
      subject,
      message,
      priority: priority || 'normal',
      pageUrl: pageUrl || '',
      userAgent: req.headers['user-agent'] || '',
    });

    // Email admin — non-blocking
    try {
      await sendEmail({
        to: process.env.EMAIL_USER || 'yonasmolla3@gmail.com',
        subject: `🆘 Support Ticket: ${subject}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff8e7;">
            <h2 style="color: #974F18;">New Support Ticket</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 6px; font-weight: bold;">From:</td><td>${name} (${email})</td></tr>
              ${phone ? `<tr><td style="padding: 6px; font-weight: bold;">Phone:</td><td>${phone}</td></tr>` : ''}
              <tr><td style="padding: 6px; font-weight: bold;">Role:</td><td>${userRole}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Category:</td><td>${category || 'other'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Priority:</td><td>${priority || 'normal'}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Page:</td><td>${pageUrl || 'unknown'}</td></tr>
            </table>
            <hr style="margin: 20px 0;" />
            <h3 style="color: #5a2e0a;">${subject}</h3>
            <p style="line-height: 1.6; color: #3a2410; white-space: pre-wrap;">${message}</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #7a5a3a; font-size: 12px;">
              Ticket ID: ${ticket._id}<br />
              Received: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Support email failed:', emailErr.message);
      // Don't fail the ticket — just note it
    }

    res.status(201).json({
      success: true,
      message:
        'Ticket received! We will respond within 24 hours. Check your email for updates.',
      ticketId: ticket._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// ADMIN — LIST ALL TICKETS
// ================================================================
router.get('/tickets', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, category, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SupportTicket.countDocuments(filter);
    const openCount = await SupportTicket.countDocuments({ status: 'open' });

    res.json({ success: true, tickets, total, openCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// ADMIN — UPDATE TICKET (status, note)
// ================================================================
router.put('/tickets/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === 'resolved' || status === 'closed') {
      update.resolvedBy = req.user._id;
      update.resolvedAt = new Date();
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;