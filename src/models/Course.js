const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    subject: {
      type: String,
      required: true,
      enum: [
        'Mathematics',
        'Environmental Science',
        'General Science',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Social Studies',
        'Geography',
        'History',
        'Geez',
      ],
    },
    grade: {
      type: String,
      required: true,
      enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    studentsEnrolled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', CourseSchema);