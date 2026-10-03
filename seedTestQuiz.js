const mongoose = require('mongoose');
require('dotenv').config();

const Quiz = require('./src/models/Quiz');
const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found. Create one first.');
      process.exit(1);
    }
    console.log(`✅ Found admin: ${admin.fullName} (${admin.email})`);

    // Create a test quiz
    const quiz = await Quiz.create({
      title: 'Test Quiz — Physics Basics',
      description: 'A quick test to verify the model works',
      subject: 'Physics',
      grade: '9',
      questions: [
        {
          question: 'What is the SI unit of force?',
          options: ['Joule', 'Newton', 'Watt', 'Pascal'],
          correctAnswer: 1,
          marks: 1,
          type: 'mcq',
          explanation: 'Force is measured in Newtons (N).',
        },
        {
          question: 'Physics is the study of matter and energy.',
          options: ['True', 'False'],
          correctAnswer: 0,
          marks: 1,
          type: 'truefalse',
        },
      ],
      totalMarks: 2,
      passingMarks: 1,
      duration: 10,
      createdBy: admin._id,
    });

    console.log('✅ Quiz created:');
    console.log(JSON.stringify(quiz, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach((k) =>
        console.log(`   - ${k}: ${err.errors[k].message}`)
      );
    }
  } finally {
    await mongoose.disconnect();
  }
})();