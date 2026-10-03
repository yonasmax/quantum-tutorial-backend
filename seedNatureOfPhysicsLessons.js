const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const User = require('./src/models/User');

const COURSE_ID = '6aa65bd29d5334bd829b0027'; // The Nature of Physics

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the course
    const course = await Course.findById(COURSE_ID);
    if (!course) {
      console.log('❌ Course not found');
      process.exit(1);
    }
    console.log(`✅ Course: ${course.title}\n`);

    // Find a teacher (or use admin)
    let teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      teacher = await User.findOne({ role: 'admin' });
    }
    if (!teacher) {
      console.log('❌ No teacher/admin found');
      process.exit(1);
    }
    console.log(`✅ Assigned teacher: ${teacher.fullName}\n`);

    // ─── Define the 3 lessons ──────────────────────────────
    const lessonsData = [
      {
        title: '1.1 Definition and Nature of Physics',
        description: 'What physics is, why it matters, and its role in understanding the universe.',
        chapter: 'Unit 1: Physics and Human Society',
        duration: 10,
        order: 1,
        content: `Definition of Physics:
- Physics is the branch of natural science that deals with matter, energy, and the interaction between them
- It explains how the entire universe behaves — from the smallest subatomic particles to the vastest galaxies
- Aim of studying physics: to explain how things work in the natural world

Why Study Physics:
- Physics is the basic rulebook for everything in nature
- It helps us understand other sciences much better
- It answers "Why" things happen in everyday life

Real-World Applications:
- How cars drive, airplanes fly, and rockets shoot into space
- How refrigerators stay cold and how TVs get pictures
- How simple kitchen tools and everyday utensils do their jobs
- Why it's easy to walk on a rough road but easy to slip on smooth, icy floor

Physics in Everyday Life:
- What makes the blades of an electric fan spin around to cool you down
- Why objects fall to the ground
- How light travels from the sun to the earth

Key Questions:
- What is physics?
- Why is physics called the fundamental science?
- Give three examples of physics in everyday life?

Entrance Based Question:
Explain why physics is considered the foundation of all natural sciences. Provide two examples.`,
      },
      {
        title: '1.2 Branches of Physics',
        description: 'Overview of the major branches: Mechanics, Thermodynamics, Optics, Electromagnetism.',
        chapter: 'Unit 1: Physics and Human Society',
        duration: 12,
        order: 2,
        content: `Mechanics:
- Study of motion and forces
- Includes kinematics, dynamics, and statics
- Example: how a ball rolls down a hill

Thermodynamics:
- Study of heat, temperature, and energy transfer
- Deals with how heat moves from hot to cold objects
- Example: how a refrigerator keeps food cold

Optics:
- Study of light and its behavior
- Deals with reflection, refraction, and lenses
- Example: how eyeglasses correct vision

Electromagnetism:
- Study of electricity and magnetism
- Explains how electric motors and generators work
- Example: how a light bulb glows

Acoustics:
- Study of sound and its properties
- Deals with how sound waves travel through air
- Example: how a guitar produces music

Key Questions:
- What are the main branches of physics?
- Which branch deals with motion and forces?
- Which branch studies light?

Entrance Based Question:
List four major branches of physics and give one real-world example of each.`,
      },
      {
        title: '1.3 Scientific Method in Physics',
        description: 'How physicists investigate the natural world through observation and experiment.',
        chapter: 'Unit 1: Physics and Human Society',
        duration: 8,
        order: 3,
        content: `Steps of the Scientific Method:
- Observe a phenomenon in nature
- Form a hypothesis (educated guess)
- Design and conduct experiments
- Analyze the data
- Draw conclusions
- Communicate results

Key Principles:
- Physics relies on measurable quantities
- Experiments must be repeatable
- Theories are tested against observations
- Scientific knowledge evolves with new evidence

Measurement in Physics:
- Physical quantities have units
- SI units are used internationally
- Examples: meter (m), kilogram (kg), second (s)

Key Questions:
- What is the scientific method?
- Why must experiments be repeatable?
- What are SI units?

Entrance Based Question:
Describe the steps of the scientific method with a physics example.`,
      },
    ];

    // ─── Delete any existing lessons for this course ──────
    const deleted = await Lesson.deleteMany({ course: COURSE_ID });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing lessons\n`);

    // ─── Insert new lessons ───────────────────────────────
    const createdLessons = [];

    for (const data of lessonsData) {
      const lesson = await Lesson.create({
        title: data.title,
        description: data.description,
        content: data.content,
        chapter: data.chapter,
        duration: data.duration,
        order: data.order,
        course: COURSE_ID,
        subject: course.subject,
        grade: course.grade,
        status: 'approved',
        isPublished: true,
        createdBy: teacher._id,
      });
      createdLessons.push(lesson);
      console.log(`✅ Created: ${data.title}`);
    }

    // ─── Attach lessons to course ─────────────────────────
    await Course.findByIdAndUpdate(COURSE_ID, {
      $set: { lessons: createdLessons.map((l) => l._id) },
    });
    console.log(`\n🔗 Attached ${createdLessons.length} lessons to the course`);

    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ Summary:`);
    console.log(`   Course: ${course.title}`);
    console.log(`   Lessons created: ${createdLessons.length}`);
    console.log('═══════════════════════════════════════════\n');
    console.log('🎉 Refresh your course page to see the lessons.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();