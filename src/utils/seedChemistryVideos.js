const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Lesson = require('../models/Lesson');

const COURSE_ID = '6aa1c210d0844d148fb417da'; // Your Chemistry course

// Real educational chemistry videos from YouTube (public educational content)
const videoData = [
  {
    lessonTitleMatch: 'U1L1',
    resources: [
      {
        type: 'youtube',
        title: 'Introduction to Chemistry',
        youtubeId: 'FSyAehMdpyI',
        description: 'Learn what chemistry is and why it matters',
        order: 1
      },
      {
        type: 'youtube',
        title: 'Why Study Chemistry?',
        youtubeId: 'QqF2v5q8F3U',
        description: 'The importance of chemistry in everyday life',
        order: 2
      }
    ]
  },
  {
    lessonTitleMatch: 'U1L2',
    resources: [
      {
        type: 'youtube',
        title: 'Matter and Its Properties',
        youtubeId: 'ELchwqH1XcU',
        description: 'Understanding matter, mass, and volume',
        order: 1
      }
    ]
  },
  {
    lessonTitleMatch: 'U1L3',
    resources: [
      {
        type: 'youtube',
        title: 'Physical and Chemical Properties',
        youtubeId: 'aB1Ld4NmO2c',
        description: 'Learn the difference between physical and chemical properties',
        order: 1
      }
    ]
  },
  {
    lessonTitleMatch: 'U1L5',
    resources: [
      {
        type: 'youtube',
        title: 'Branches of Chemistry',
        youtubeId: 'TElY1tRPOYU',
        description: 'Explore the 5 main branches of chemistry',
        order: 1
      }
    ]
  },
  {
    lessonTitleMatch: 'U1L11',
    resources: [
      {
        type: 'youtube',
        title: 'Chemistry in Agriculture',
        youtubeId: 'wUY5Hf7xn3w',
        description: 'How chemistry helps grow food',
        order: 1
      }
    ]
  },
  {
    lessonTitleMatch: 'U1L13',
    resources: [
      {
        type: 'youtube',
        title: 'Chemistry in Medicine',
        youtubeId: 'l6YXAL-o3Lc',
        description: 'How chemistry saves lives',
        order: 1
      }
    ]
  }
];

async function seedVideos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const data of videoData) {
      const lesson = await Lesson.findOne({
        course: COURSE_ID,
        title: { $regex: data.lessonTitleMatch, $options: 'i' }
      });

      if (!lesson) {
        console.log(`⏭️  Lesson not found: ${data.lessonTitleMatch}`);
        continue;
      }

      lesson.resources = data.resources;
      await lesson.save();
      console.log(`✅ Added ${data.resources.length} media to: ${lesson.title}`);
    }

    console.log('\n🎉 Done seeding Chemistry videos!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedVideos();