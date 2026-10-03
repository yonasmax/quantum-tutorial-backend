const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const FundraisingProject = require('../models/FundraisingProject');

// Get all active projects
router.get('/', async (req, res) => {
  try {
    const projects = await FundraisingProject.find({
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, organization, ngoName, contactEmail, contactPhone, goalAmount, category, startDate, endDate } = req.body;

    const project = await FundraisingProject.create({
      title,
      description,
      organization,
      ngoName,
      contactEmail,
      contactPhone,
      goalAmount: parseFloat(goalAmount),
      raisedAmount: 0,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'pending',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;