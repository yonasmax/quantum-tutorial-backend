const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

// ================================================================
// Sample questions per subject/grade (small test set)
// ================================================================
const sampleQuestions = {
  '6': [
    {
      question: 'What is 7 × 8?',
      options: ['54', '56', '58', '64'],
      correctAnswer: 1,
      marks: 1,
      type: 'mcq',
      explanation: '7 × 8 = 56.',
    },
    {
      question: 'The capital city of Ethiopia is Addis Ababa.',
      options: ['True', 'False'],
      correctAnswer: 0,
      marks: 1,
      type: 'truefalse',
    },
    {
      question: 'Which is a prime number?',
      options: ['4', '6', '7', '9'],
      correctAnswer: 2,
      marks: 1,
      type: 'mcq',
      explanation: '7 is prime — only divisible by 1 and 7.',
    },
  ],
  '8': [
    {
      question: 'What is the SI unit of force?',
      options: ['Joule', 'Newton', 'Watt', 'Pascal'],
      correctAnswer: 1,
      marks: 1,
      type: 'mcq',
      explanation: 'Force is measured in Newtons (N).',
    },
    {
      question: 'Water boils at 100°C at sea level.',
      options: ['True', 'False'],
      correctAnswer: 0,
      marks: 1,
      type: 'truefalse',
    },
    {
      question: 'Which gas do plants absorb during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
      correctAnswer: 2,
      marks: 1,
      type: 'mcq',
      explanation: 'Plants absorb CO₂ to make glucose.',
    },
  ],
  '12': [
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
    {
      question: 'What is the speed of light in a vacuum?',
      options: ['3×10^6 m/s', '3×10^8 m/s', '3×10^5 m/s', '3×10^10 m/s'],
      correctAnswer: 1,
      marks: 1,
      type: 'mcq',
      explanation: 'Speed of light ≈ 3×10^8 m/s.',
    },
  ],
};

// ================================================================
// Main seed logic
// ================================================================
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ No admin user found');
      process.exit(1);
    }
    console.log(`✅ Admin: ${admin.fullName} (${admin._id})\n`);

    const grades = ['6', '8', '12'];
    let createdEntrance = 0;
    let createdModel = 0;

    for (const grade of grades) {
      const questions = sampleQuestions[grade];

      // ─── 1. ENTRANCE EXAM ───────────────────────────────
      const entranceTitle = `Grade ${grade} Entrance Exam 2026 — Physics`;
      let entranceExam = await Exam.findOne({ title: entranceTitle });

      if (!entranceExam) {
        entranceExam = await Exam.create({
          title: entranceTitle,
          description: `Official entrance exam for Grade ${grade} — must pass to unlock the Model Exam.`,
          subject: 'Physics',
          grade,
          questions,
          duration: 30,
          totalMarks: questions.length,
          passingMarks: 50,
          startDate: new Date(),
          endDate: new Date('2027-12-31'),
          examType: 'entrance',
          status: 'approved',
          isActive: true,
          createdBy: admin._id,
        });
        console.log(`✅ [Grade ${grade}] Created ENTRANCE exam: ${entranceTitle}`);
        createdEntrance++;
      } else {
        console.log(`ℹ️  [Grade ${grade}] Entrance exam already exists`);
      }

      // ─── 2. MODEL EXAM ──────────────────────────────────
      const modelTitle = `Grade ${grade} Model Exam 2026 — Physics`;
      let modelExam = await Exam.findOne({ title: modelTitle });

      if (!modelExam) {
        modelExam = await Exam.create({
          title: modelTitle,
          description: `Full-length model exam for Grade ${grade} — auto-graded practice for the real national exam.`,
          subject: 'Physics',
          grade,
          questions,
          duration: 120,
          totalMarks: questions.length,
          passingMarks: 50,
          startDate: new Date(),
          endDate: new Date('2027-12-31'),
          examType: 'model',
          prerequisiteExamType: 'entrance',
          prerequisitePassingScore: 50,
          status: 'approved',
          isActive: true,
          createdBy: admin._id,
        });
        console.log(`✅ [Grade ${grade}] Created MODEL exam: ${modelTitle}`);
        createdModel++;
      } else {
        console.log(`ℹ️  [Grade ${grade}] Model exam already exists`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════');
    console.log(`📊 Summary:`);
    console.log(`   Entrance exams created: ${createdEntrance}`);
    console.log(`   Model exams created:    ${createdModel}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('🎉 Done! Refresh your dashboard at https://quantum-tutorial.vercel.app');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();