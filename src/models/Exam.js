const mongoose = require('mongoose');
const QuestionSchema = require('./Question');

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an exam title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    questions: [QuestionSchema],
    duration: {
      type: Number,
      required: true,
      default: 60,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      required: true,
      default: 50,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ===== REVIEW WORKFLOW FIELDS =====
    status: {
      type: String,
      enum: ['draft', 'pendingReview', 'approved', 'rejected'],
      default: 'draft',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,
    reviewReason: {
      type: String,
      default: '',
    },

    // ===== MODEL EXAM FIELDS (NEW) =====
    examType: {
      type: String,
      enum: ['regular', 'entrance', 'model'],
      default: 'regular',
      required: true,
      // 'regular'  = normal exam
      // 'entrance' = entrance exam (prerequisite for model)
      // 'model'    = model exam (requires passing entrance)
    },
    prerequisiteExamType: {
      type: String,
      enum: ['entrance', null],
      default: null,
      // If set, student must have passed an exam of this type
      // Example: a 'model' exam has prerequisiteExamType = 'entrance'
    },
    prerequisitePassingScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      // Minimum percentage needed on the prerequisite exam to unlock this one
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Fast query for available exams by type and status
ExamSchema.index({ examType: 1, status: 1, isActive: 1 });

module.exports = mongoose.model('Exam', ExamSchema);