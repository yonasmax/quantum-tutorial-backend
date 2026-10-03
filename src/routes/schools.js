const express = require('express');
const router = express.Router();

/**
 * POST /api/schools/request
 * Public endpoint — no auth required.
 * Logs the request and (optionally) emails admin.
 */
router.post('/request', async (req, res) => {
  try {
    const { schoolName, contactName, email, phone, students, message } = req.body;

    if (!schoolName || !contactName || !phone) {
      return res.status(400).json({ error: 'schoolName, contactName, phone are required' });
    }

    // Log to console (Vercel logs)
    console.log('=== NEW SCHOOL REQUEST ===');
    console.log('School:', schoolName);
    console.log('Contact:', contactName);
    console.log('Email:', email || '(not provided)');
    console.log('Phone:', phone);
    console.log('Students:', students || '(not provided)');
    console.log('Message:', message || '(not provided)');
    console.log('Timestamp:', new Date().toISOString());
    console.log('==========================');

    // TODO: Save to database (SchoolRequest model) when you build it
    // TODO: Send email notification to admin

    // Optional: Send email if you have email service wired up
    try {
      const emailService = require('../utils/email');
      if (emailService && emailService.send) {
        await emailService.send({
          to: process.env.ADMIN_EMAIL || 'you@example.com',
          subject: `🏫 New School Request: ${schoolName}`,
          html: `
            <h2>New School Bulk Plan Request</h2>
            <ul>
              <li><strong>School:</strong> ${schoolName}</li>
              <li><strong>Contact:</strong> ${contactName}</li>
              <li><strong>Email:</strong> ${email || '(not provided)'}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Students:</strong> ${students || '(not provided)'}</li>
              <li><strong>Message:</strong> ${message || '(not provided)'}</li>
            </ul>
          `,
        });
      }
    } catch (emailErr) {
      console.warn('Email send failed (non-critical):', emailErr.message);
    }

    res.json({ success: true, message: 'Request received' });
  } catch (err) {
    console.error('School request error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;