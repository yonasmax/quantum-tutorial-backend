const router = require('express').Router();
const { protect } = require('../middleware/auth');
const GeezAlphabet = require('../models/GeezAlphabet');
const GeezNumber = require('../models/GeezNumber');
const GeezProgress = require('../models/GeezProgress');

// ፊደላት
router.get('/alphabet', protect, async (req, res) => {
  try {
    const letters = await GeezAlphabet.find().sort({ order: 1 });
    res.json({ success: true, letters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alphabet/family/:family', protect, async (req, res) => {
  try {
    const letters = await GeezAlphabet.find({ family: req.params.family }).sort({
      order: 1,
    });
    res.json({ success: true, letters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// አኀዝ
router.get('/numbers', protect, async (req, res) => {
  try {
    const numbers = await GeezNumber.find().sort({ value: 1 });
    res.json({ success: true, numbers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ውጤት
router.get('/progress/me', protect, async (req, res) => {
  try {
    let p = await GeezProgress.findOne({ user: req.user._id });
    if (!p) p = await GeezProgress.create({ user: req.user._id });
    res.json({ success: true, progress: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/progress/master-letter', protect, async (req, res) => {
  try {
    const { char } = req.body;
    let p = await GeezProgress.findOne({ user: req.user._id });
    if (!p) p = await GeezProgress.create({ user: req.user._id });

    const already = p.alphabetMastered.find((a) => a.char === char);
    if (already) {
      already.attempts = (already.attempts || 0) + 1;
    } else {
      p.alphabetMastered.push({ char, attempts: 1, masteredAt: new Date() });
    }
    p.lastActivity = new Date();
    await p.save();
    res.json({ success: true, progress: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/progress/master-number', protect, async (req, res) => {
  try {
    const { value } = req.body;
    let p = await GeezProgress.findOne({ user: req.user._id });
    if (!p) p = await GeezProgress.create({ user: req.user._id });

    const already = p.numbersMastered.find((n) => n.value === value);
    if (already) {
      already.attempts = (already.attempts || 0) + 1;
    } else {
      p.numbersMastered.push({ value, attempts: 1, masteredAt: new Date() });
    }
    p.lastActivity = new Date();
    await p.save();
    res.json({ success: true, progress: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;