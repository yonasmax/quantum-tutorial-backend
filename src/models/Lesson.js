const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════
// CONTENT BLOCK SCHEMA — structured lesson notes
// ═══════════════════════════════════════════════════════════════
const ContentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'bullets', 'keyTerm', 'image', 'callout'],
      required: true,
    },
    // For heading, paragraph, keyTerm, callout
    text: { type: String, default: '' },
    // For bullets
    items: { type: [String], default: [] },
    // For image
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
    caption: { type: String, default: '' },
    // For callout
    variant: {
      type: String,
      enum: ['info', 'warning', 'success', 'tip'],
      default: 'info',
    },
  },
  { _id: true }
);

// ═══════════════════════════════════════════════════════════════
// QUIZ QUESTION SCHEMA — embedded auto-quiz
// ═══════════════════════════════════════════════════════════════
const QuizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true, min: 0 },
    marks: { type: Number, default: 1, min: 1 },
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

// ═══════════════════════════════════════════════════════════════
// LESSON SCHEMA
// ═══════════════════════════════════════════════════════════════
const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a lesson title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    chapter: {
      type: String,
      default: 'Unit 1',
    },
    order: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 10, // minutes
    },

    // ⭐ NEW — A. Objectives
    objectives: {
      type: [String],
      default: [],
    },

    // ⭐ NEW — B. Detailed notes (structured blocks)
    notes: {
      type: [ContentBlockSchema],
      default: [],
    },

    // Keep legacy `content` field for backward compat
    content: {
      type: String,
      default: '',
    },

    // ⭐ C. Video
    videoUrl: {
      type: String,
      default: '',
    },
    videoTitle: {
      type: String,
      default: '',
    },

    // ⭐ D. Auto-quiz
    quiz: {
      questions: {
        type: [QuizQuestionSchema],
        default: [],
      },
      passingMarks: {
        type: Number,
        default: 50,
      },
      showAnswersImmediately: {
        type: Boolean,
        default: true,
      },
    },

    // Legacy
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    resources: [
      {
        title: String,
        description: String,
        type: String,
        url: String,
        youtubeId: String,
      },
    ],
    notebook: {
      objectives: [String],
      summary: [String],
      reviewQuestions: [String],
      fullNotes: String,
      generatedBy: String,
    },

    // Review workflow
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

    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

LessonSchema.index({ status: 1, createdAt: -1 });
LessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', LessonSchema);