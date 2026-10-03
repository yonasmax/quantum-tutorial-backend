const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const {
  PLANS,
  activateSubscription,
  isSubscriptionActive,
  getDaysRemaining,
} = require('../services/subscriptionService');

// ================================================================
// GET /api/subscriptions/plans — public pricing
// ================================================================
router.get('/plans', async (req, res) => {
  res.json({
    success: true,
    plans: Object.values(PLANS),
  });
});

// ================================================================
// GET /api/subscriptions/me — my current subscription
// ================================================================
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const active = isSubscriptionActive(user);
    const daysRemaining = active ? getDaysRemaining(user) : 0;

    res.json({
      success: true,
      subscription: user.subscription || null,
      isActive: active,
      daysRemaining,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/subscriptions/my-payments — payment history
// ================================================================
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/subscriptions/initiate
// Body: { planId }  → returns payment info for Telebirr
// ================================================================
router.post('/initiate', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({
        error: `Unknown plan: ${planId}. Available: ${Object.keys(PLANS).join(', ')}`,
      });
    }

    // Create a pending payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount: plan.price,
      currency: plan.currency,
      method: 'telebirr',
      plan: planId,
      status: 'pending',
      description: `${plan.name} Subscription — ${plan.label}`,
    });

    // ⚠️ Telebirr integration comes here.
    // For now, return the payment record so admin can manually approve.
    res.json({
      success: true,
      payment,
      message:
        'Payment initiated. Telebirr integration coming soon. Contact admin to complete.',
      telebirrReady: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/subscriptions/admin/activate
// Body: { userId, planId, paymentId }
// Admin-only manual activation (useful while Telebirr is pending)
// ================================================================
router.post(
  '/admin/activate',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { userId, planId, paymentId } = req.body;

      if (!userId || !planId) {
        return res
          .status(400)
          .json({ error: 'userId and planId are required' });
      }

      const subscription = await activateSubscription(
        userId,
        planId,
        paymentId || null
      );

      // If payment ID provided, mark it confirmed
      if (paymentId) {
        await Payment.findByIdAndUpdate(paymentId, {
          status: 'confirmed',
          confirmedAt: new Date(),
          confirmedBy: req.user._id,
        });
      }

      res.json({ success: true, subscription });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// POST /api/subscriptions/admin/expire/:userId — force expire
// ================================================================
router.post(
  '/admin/expire/:userId',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.subscription.isActive = false;
      user.subscription.expiredAt = new Date();
      await user.save();

      res.json({ success: true, subscription: user.subscription });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;