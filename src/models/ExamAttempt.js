const mongoose = require('mongoose');

const ExamAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const ExamAttemptSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [ExamAnswerSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    autoSubmitted: {
      type: Boolean,
      default: false, // true if the timer expired
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'graded'],
      default: 'in-progress',
    },

    // ⭐ CERTIFICATE FIELDS
    certificateCode: {
      type: String,
      default: null,
      index: true,
    },
    certificateIssuedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One exam attempt per student per exam (retakes blocked at app level)
ExamAttemptSchema.index({ exam: 1, student: 1 });

module.exports = mongoose.model('ExamAttempt', ExamAttemptSchema);