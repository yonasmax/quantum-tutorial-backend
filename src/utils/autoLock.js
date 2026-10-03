const cron = require('node-cron');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendEmail } = require('./email');

exports.runAutoLock = async () => {
  try {
    console.log('🔒 Running auto-lock check...');
    const now = new Date();
    
    const expiredSubscriptions = await Subscription.find({
      isActive: true,
      endDate: { $lt: now }
    });

    console.log(`🔒 Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const sub of expiredSubscriptions) {
      sub.isActive = false;
      await sub.save();
      
      await User.findByIdAndUpdate(sub.user, { isLocked: true });
      
      const user = await User.findById(sub.user);
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: '🔒 Your Quantum Tutorial Subscription Has Expired',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #d32f2f;">Subscription Expired</h2>
              <p>Dear ${user.fullName},</p>
              <p>Your Quantum Tutorial subscription expired on <strong>${sub.endDate.toLocaleDateString()}</strong>.</p>
              <p>To continue learning, please renew your subscription.</p>
              <a href="${process.env.FRONTEND_URL}/payment" 
                 style="background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 10px;">
                Renew Now
              </a>
            </div>
          `
        });
      }
      console.log(`🔒 Locked user: ${sub.user}`);
    }

    console.log(`✅ Auto-lock complete. ${expiredSubscriptions.length} users locked.`);
    return { locked: expiredSubscriptions.length };
  } catch (error) {
    console.error('❌ Auto-lock error:', error);
    throw error;
  }
};

// Run every hour
cron.schedule('0 * * * *', () => {
  exports.runAutoLock().catch(err => console.error('Auto-lock cron error:', err));
});

// Run at midnight
cron.schedule('0 0 * * *', () => {
  exports.runAutoLock().catch(err => console.error('Auto-lock cron error:', err));
});