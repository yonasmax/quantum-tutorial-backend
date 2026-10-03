const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const InvestorApplication = require('../models/InvestorApplication');

// Apply as investor
router.post('/apply', async (req, res) => {
  try {
    const { fullName, email, phone, company, title, investmentAmount, message, interestAreas } = req.body;

    const application = await InvestorApplication.create({
      fullName,
      email,
      phone,
      company,
      title,
      investmentAmount: parseFloat(investmentAmount),
      message,
      interestAreas: interestAreas || [],
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const applications = await InvestorApplication.find(query)
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;