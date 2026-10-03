const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Advertisement = require('../models/Advertisement');

// Get all active ads
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const ads = await Advertisement.find({
      isActive: true,
      $or: [{ startDate: { $lte: now } }, { startDate: null }],
      $or: [{ endDate: { $gte: now } }, { endDate: null }]
    });

    res.json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ad
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { companyName, title, description, imageUrl, linkUrl, category, position, startDate, endDate, contactEmail, contactPhone } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Please provide an image URL' });
    }

    const ad = await Advertisement.create({
      companyName,
      title,
      description,
      imageUrl,
      linkUrl,
      category,
      position,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      contactEmail,
      contactPhone,
      isActive: true
    });

    res.status(201).json({ success: true, ad });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;