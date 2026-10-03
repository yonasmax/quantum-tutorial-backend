const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const SubjectAssignment = require('../src/models/SubjectAssignment');
const User = require('../src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find teacher
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('❌ No teacher found. Create one first:');
      console.log('   Register at /register with role: Teacher');
      process.exit(1);
    }
    console.log(`✅ Teacher: ${teacher.fullName} (${teacher.email})\n`);

    // Find an admin to mark as assigner
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin found');
      process.exit(1);
    }

    // Assignments to create
    const assignments = [
      { subject: 'Physics', grade: '9' },
      { subject: 'Physics', grade: '10' },
      { subject: 'Chemistry', grade: '9' },
    ];

    for (const a of assignments) {
      const exists = await SubjectAssignment.findOne({
        teacher: teacher._id,
        subject: a.subject,
        grade: a.grade,
      });
      if (exists) {
        console.log(`ℹ️  Already assigned: ${a.subject} — Grade ${a.grade}`);
        continue;
      }
      await SubjectAssignment.create({
        teacher: teacher._id,
        subject: a.subject,
        grade: a.grade,
        assignedBy: admin._id,
        isActive: true,
        notes: 'Demo assignment',
      });
      console.log(`✅ Assigned: ${a.subject} — Grade ${a.grade}`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Done! Teacher now has access to:');
    console.log('   • Physics Grade 9');
    console.log('   • Physics Grade 10');
    console.log('   • Chemistry Grade 9');
    console.log('═══════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();