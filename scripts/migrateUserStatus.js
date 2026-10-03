const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find users without a status field OR with null/undefined status
    const result = await User.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' },
        ],
      },
      { $set: { status: 'active' } }
    );

    console.log(`✅ Migration complete:`);
    console.log(`   Matched: ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}\n`);

    // Count by status
    const pending = await User.countDocuments({ status: 'pending' });
    const active = await User.countDocuments({ status: 'active' });
    const rejected = await User.countDocuments({ status: 'rejected' });

    console.log('📊 Current distribution:');
    console.log(`   Pending: ${pending}`);
    console.log(`   Active:  ${active}`);
    console.log(`   Rejected: ${rejected}\n`);

    console.log('🎉 Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();