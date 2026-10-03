const { isSubscriptionActive } = require('../services/subscriptionService');

// ================================================================
// requireSubscription — Blocks non-subscribed users
// Exempts: admin, teacher (staff access always)
// ================================================================
module.exports = (req, res, next) => {
  // Staff always pass
  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    return next();
  }

  // No subscription object
  if (!req.user.subscription) {
    return res.status(403).json({
      error: 'Subscription required. Please subscribe to access this content.',
      needsSubscription: true,
      code: 'NO_SUBSCRIPTION',
    });
  }

  // Subscription exists but not active
  if (!req.user.subscription.isActive) {
    return res.status(403).json({
      error: 'Your subscription is not active. Please renew to continue.',
      needsSubscription: true,
      code: 'INACTIVE_SUBSCRIPTION',
    });
  }

  // Expired
  if (!isSubscriptionActive(req.user)) {
    return res.status(403).json({
      error: 'Your subscription has expired. Please renew to continue.',
      needsSubscription: true,
      expired: true,
      code: 'EXPIRED_SUBSCRIPTION',
    });
  }

  // All checks passed
  next();
};