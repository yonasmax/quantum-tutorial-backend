const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendEmail } = require('./emailService');

// ================================================================
// PLAN DEFINITIONS — change prices here
// ================================================================
const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    price: 1500,
    currency: 'ETB',
    durationDays: 30,
    discount: 0,
    label: '1 month',
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly',
    price: 4500, // 10% off vs 3× monthly
    currency: 'ETB',
    durationDays: 90,
    discount: 10,
    label: '3 months',
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly',
    price: 15000, // 20% off vs 12× monthly
    currency: 'ETB',
    durationDays: 365,
    discount: 20,
    label: '12 months',
  },
};

// ================================================================
// ACTIVATE — Set subscription active with start + expiry
// ================================================================
const activateSubscription = async (userId, planId, paymentId = null) => {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date();
  const expiry = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  user.subscription = {
    isActive: true,
    startDate: now,
    expiryDate: expiry,
    plan: planId,
    lastPaymentId: paymentId,
    renewedAt: now,
  };

  await user.save();

  // Fire confirmation email (non-blocking)
  try {
    await sendEmail({
      to: user.email,
      subject: `✅ Subscription Activated — ${plan.name}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7a3d10 0%, #974F18 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff8e7; margin: 0; font-size: 22px;">Subscription Active</h1>
          </div>
          <div style="background: #fff8e7; padding: 30px; border-radius: 0 0 12px 12px; border: 2px solid #d4af37; border-top: none;">
            <p style="color: #3a2410; font-size: 15px;">Hi <strong>${user.fullName}</strong>,</p>
            <p style="color: #3a2410; font-size: 15px;">Your <strong>${plan.name}</strong> subscription is now active! 🎉</p>
            <div style="background: #fff; padding: 16px; border-radius: 10px; border: 1px solid #d4af37; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Plan:</strong> ${plan.name}</p>
              <p style="margin: 4px 0;"><strong>Amount:</strong> ${plan.price} ${plan.currency}</p>
              <p style="margin: 4px 0;"><strong>Started:</strong> ${now.toLocaleDateString('en-GB')}</p>
              <p style="margin: 4px 0;"><strong>Expires:</strong> ${expiry.toLocaleDateString('en-GB')}</p>
            </div>
            <p style="color: #3a2410; font-size: 15px;">You now have full access to all your enrolled courses, lessons, and exams.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app'}/courses"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #974F18, #5a2e0a); color: #fff8e7; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; border: 2px solid #d4af37;">
                Start Learning →
              </a>
            </div>
            <p style="color: #7a5a3a; font-size: 12px; text-align: center; margin-top: 20px;">
              Made in Ethiopia 🇪🇹
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Subscription email failed:', err.message);
  }

  return user.subscription;
};

// ================================================================
// CHECK — Is user's subscription active right now?
// ================================================================
const isSubscriptionActive = (user) => {
  if (!user.subscription) return false;
  if (!user.subscription.isActive) return false;
  if (!user.subscription.expiryDate) return false;

  const expiry = new Date(user.subscription.expiryDate);
  const now = new Date();

  return expiry > now;
};

// ================================================================
// DAYS REMAINING
// ================================================================
const getDaysRemaining = (user) => {
  if (!user.subscription?.expiryDate) return 0;
  const expiry = new Date(user.subscription.expiryDate);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ================================================================
// EXPIRE — Called by cron when subscription has ended
// ================================================================
const expireSubscription = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.subscription.isActive = false;
  user.subscription.expiredAt = new Date();
  await user.save();

  // Send expiry notification
  try {
    await sendEmail({
      to: user.email,
      subject: '⏰ Your subscription has expired',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7a3d10 0%, #974F18 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff8e7; margin: 0; font-size: 22px;">Subscription Expired</h1>
          </div>
          <div style="background: #fff8e7; padding: 30px; border-radius: 0 0 12px 12px; border: 2px solid #d4af37; border-top: none;">
            <p style="color: #3a2410; font-size: 15px;">Hi <strong>${user.fullName}</strong>,</p>
            <p style="color: #3a2410; font-size: 15px;">Your subscription has expired. Your courses are now locked, but your progress is saved.</p>
            <p style="color: #3a2410; font-size: 15px;">Renew anytime to continue learning exactly where you left off.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app'}/subscriptions"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d4af37, #b8941f); color: #4a2a0a; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; border: 2px solid #8a6b1f;">
                Renew Now →
              </a>
            </div>
            <p style="color: #7a5a3a; font-size: 12px; text-align: center; margin-top: 20px;">
              Made in Ethiopia 🇪🇹
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Expiry email failed:', err.message);
  }

  return user.subscription;
};

// ================================================================
// SEND EXPIRY REMINDER (7 days / 3 days before)
// ================================================================
const sendExpiryReminder = async (user, daysLeft) => {
  try {
    await sendEmail({
      to: user.email,
      subject: `⏰ Your subscription ends in ${daysLeft} days`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf6; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7a3d10 0%, #974F18 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff8e7; margin: 0; font-size: 22px;">Renewal Reminder</h1>
          </div>
          <div style="background: #fff8e7; padding: 30px; border-radius: 0 0 12px 12px; border: 2px solid #d4af37; border-top: none;">
            <p style="color: #3a2410; font-size: 15px;">Hi <strong>${user.fullName}</strong>,</p>
            <p style="color: #3a2410; font-size: 15px;">Your subscription ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
            <p style="color: #3a2410; font-size: 15px;">Renew now to keep uninterrupted access to all your courses.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app'}/subscriptions"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d4af37, #b8941f); color: #4a2a0a; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; border: 2px solid #8a6b1f;">
                Renew Subscription →
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Reminder email failed:', err.message);
  }
};

module.exports = {
  PLANS,
  activateSubscription,
  isSubscriptionActive,
  getDaysRemaining,
  expireSubscription,
  sendExpiryReminder,
};