const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const EOTCContent = require('../models/EOTCContent');

// Get all EOTC content
router.get('/', protect, async (req, res) => {
  try {
    const { type, category } = req.query;
    const query = { isPublished: true };
    if (type) query.type = type;
    if (category) query.category = category;

    const content = await EOTCContent.find(query)
      .sort({ createdAt: -1 });

    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get EOTC Bible
router.get('/bible', protect, async (req, res) => {
  try {
    const bible = await EOTCContent.find({ 
      type: 'bible',
      isPublished: true 
    }).sort({ title: 1 });

    res.json({ success: true, bible });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create EOTC content
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, type, category, description, content, author, tags } = req.body;

    const eotcContent = await EOTCContent.create({
      title,
      type,
      category,
      description,
      content: content || '',
      author: author || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      uploadedBy: req.user._id,
      isPublished: true
    });

    res.status(201).json({ success: true, eotcContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;