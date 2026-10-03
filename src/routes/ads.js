const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const AdImpression = require('../models/AdImpression');
const { protect, authorize } = require('../middleware/auth');

// ================================================================
// GET /api/ads/active?placement=sidebar
// PUBLIC — returns ads for the current user
// ================================================================
router.get('/active', protect, async (req, res) => {
  try {
    const { placement = 'sidebar', limit = 5 } = req.query;
    const now = new Date();

    const filter = {
      status: 'approved',
      placement,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    // Targeting
    if (req.user.role === 'student' && req.user.grade) {
      filter.$or = [
        { targetGrades: { $size: 0 } },
        { targetGrades: req.user.grade },
      ];
    }

    const ads = await Ad.find(filter)
      .sort({ plan: -1, impressions: 1 })
      .limit(parseInt(limit, 10))
      .select(
        'title description imageUrl targetUrl ctaText placement advertiserName'
      );

    res.json({ success: true, count: ads.length, ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/ads/:id/impression — track a view
// ================================================================
router.post('/:id/impression', protect, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    ad.impressions = (ad.impressions || 0) + 1;
    await ad.save();

    await AdImpression.create({
      ad: ad._id,
      user: req.user._id,
      action: 'impression',
      placement: ad.placement,
      page: req.body.page || '',
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
      referrer: req.body.referrer || '',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/ads/:id/click — track a click
// ================================================================
router.post('/:id/click', protect, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });

    ad.clicks = (ad.clicks || 0) + 1;
    await ad.save();

    await AdImpression.create({
      ad: ad._id,
      user: req.user._id,
      action: 'click',
      placement: ad.placement,
      page: req.body.page || '',
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
      referrer: req.body.referrer || '',
    });

    res.json({ success: true, redirectUrl: ad.targetUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/ads — create (admin only, or public submission)
// ================================================================
router.post('/', async (req, res) => {
  try {
    const {
      advertiserName,
      advertiserEmail,
      advertiserPhone,
      title,
      description,
      imageUrl,
      targetUrl,
      ctaText,
      placement,
      startDate,
      endDate,
      plan,
      amountPaid,
      targetGrades,
      targetSubjects,
      targetRoles,
    } = req.body;

    if (
      !advertiserName ||
      !advertiserEmail ||
      !title ||
      !imageUrl ||
      !targetUrl ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        error:
          'advertiserName, advertiserEmail, title, imageUrl, targetUrl, startDate, endDate are required',
      });
    }

    const ad = await Ad.create({
      advertiserName,
      advertiserEmail,
      advertiserPhone: advertiserPhone || '',
      title,
      description: description || '',
      imageUrl,
      targetUrl,
      ctaText: ctaText || 'Learn More',
      placement: placement || 'sidebar',
      targetGrades: targetGrades || [],
      targetSubjects: targetSubjects || [],
      targetRoles: targetRoles || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      plan: plan || 'starter',
      amountPaid: amountPaid || 0,
      status: 'pending',
    });

    res.status(201).json({ success: true, ad });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================================================================
// GET /api/ads/admin/all — admin list all ads
// ================================================================
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, placement, limit = 200 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (placement) filter.placement = placement;

    const ads = await Ad.find(filter)
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const counts = {
      pending: await Ad.countDocuments({ status: 'pending' }),
      approved: await Ad.countDocuments({ status: 'approved' }),
      rejected: await Ad.countDocuments({ status: 'rejected' }),
      paused: await Ad.countDocuments({ status: 'paused' }),
      expired: await Ad.countDocuments({ status: 'expired' }),
    };

    res.json({ success: true, count: ads.length, counts, ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/ads/admin/stats/:id — per-ad stats
// ================================================================
router.get(
  '/admin/stats/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const ad = await Ad.findById(req.params.id);
      if (!ad) return res.status(404).json({ error: 'Ad not found' });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentImpressions = await AdImpression.countDocuments({
        ad: ad._id,
        action: 'impression',
        createdAt: { $gte: sevenDaysAgo },
      });
      const recentClicks = await AdImpression.countDocuments({
        ad: ad._id,
        action: 'click',
        createdAt: { $gte: sevenDaysAgo },
      });

      res.json({
        success: true,
        ad: {
          _id: ad._id,
          title: ad.title,
          impressions: ad.impressions,
          clicks: ad.clicks,
          ctr: ad.ctr,
          plan: ad.plan,
        },
        recent: {
          impressions7d: recentImpressions,
          clicks7d: recentClicks,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// PUT /api/ads/:id/approve
// ================================================================
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        rejectionReason: '',
      },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/ads/:id/reject
// ================================================================
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: reason || '',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/ads/:id/pause
// ================================================================
router.put('/:id/pause', protect, authorize('admin'), async (req, res) => {
  try {
    const { paused } = req.body;
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: paused ? 'paused' : 'approved' },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/ads/:id — edit
// ================================================================
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================================================================
// DELETE /api/ads/:id
// ================================================================
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await AdImpression.deleteMany({ ad: req.params.id });
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (!ad) return res.status(404).json({ error: 'Ad not found' });
    res.json({ success: true, message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;