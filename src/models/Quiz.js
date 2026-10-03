const mongoose = require('mongoose');
const QuestionSchema = require('./Question');

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a quiz title'],
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
    sourceLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    },
    questions: [QuestionSchema],
    duration: {
      type: Number,
      default: 15,
      min: 1,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      default: 50,
    },
    attemptsAllowed: {
      type: Number,
      default: 3,
      min: 1,
    },
    showAnswersImmediately: {
      type: Boolean,
      default: true,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// ===== Enforce question rules that depend on the parent doc =====
QuizSchema.pre('validate', function (next) {
  if (this.questions && this.questions.length > 0) {
    for (const q of this.questions) {
      if (q.type === 'truefalse' && q.options && q.options.length !== 2) {
        return next(
          new Error(
            `True/False question "${q.question}" must have exactly 2 options`
          )
        );
      }
      if (q.options && q.correctAnswer >= q.options.length) {
        return next(
          new Error(
            `Question "${q.question}" correctAnswer index (${q.correctAnswer}) is out of range`
          )
        );
      }
    }
  }
  next();
});

// Fast query for the review queue
QuizSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', QuizSchema);