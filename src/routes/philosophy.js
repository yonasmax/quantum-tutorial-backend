const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const PhilosophyTradition = require('../models/PhilosophyTradition');
const PhilosophyText = require('../models/PhilosophyText');

// ================================================================
// LIST ALL TRADITIONS BY CATEGORY
// ================================================================
router.get('/traditions', protect, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;

    const traditions = await PhilosophyTradition.find(filter).sort({ order: 1 });
    res.json({ success: true, count: traditions.length, traditions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// LIST TRADITIONS GROUPED BY CATEGORY (for the hub page)
// ================================================================
router.get('/hub', protect, async (req, res) => {
  try {
    const traditions = await PhilosophyTradition.find({ isPublished: true }).sort({
      order: 1,
    });

    const grouped = {
      eastern: [],
      western: [],
      classics: [],
      poets: [],
      ethiopian: [],
      comparative: [],
    };

    traditions.forEach((t) => {
      if (grouped[t.category]) grouped[t.category].push(t);
    });

    res.json({ success: true, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET ONE TRADITION + ITS TEXTS
// ================================================================
router.get('/traditions/:id', protect, async (req, res) => {
  try {
    const tradition = await PhilosophyTradition.findById(req.params.id);
    if (!tradition) return res.status(404).json({ error: 'Tradition not found' });

    const texts = await PhilosophyText.find({ tradition: tradition._id }).sort({
      order: 1,
    });

    res.json({ success: true, tradition, texts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET ONE TEXT
// ================================================================
router.get('/texts/:id', protect, async (req, res) => {
  try {
    const text = await PhilosophyText.findById(req.params.id).populate(
      'tradition',
      'name category icon'
    );
    if (!text) return res.status(404).json({ error: 'Text not found' });
    res.json({ success: true, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// ADMIN — CREATE TRADITION
// ================================================================
router.post(
  '/traditions',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const tradition = await PhilosophyTradition.create(req.body);
      res.status(201).json({ success: true, tradition });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ================================================================
// ADMIN — CREATE TEXT
// ================================================================
router.post('/texts', protect, authorize('admin'), async (req, res) => {
  try {
    const text = await PhilosophyText.create(req.body);
    res.status(201).json({ success: true, text });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;