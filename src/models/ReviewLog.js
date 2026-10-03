const mongoose = require('mongoose');

/**
 * ReviewLog
 * Immutable audit trail of every review action (approve/reject).
 * Never delete these — they're the accountability record.
 */
const ReviewLogSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ['quiz', 'exam', 'lesson'],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // polymorphic ref — points to Quiz, Exam, or Lesson
    },
    contentTitle: String, // snapshot of title at time of review

    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      required: true,
    },

    // Who did the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorRole: String, // snapshot: 'teacher' or 'admin'

    // For 'rejected' actions — reason shown to the teacher
    reason: {
      type: String,
      default: '',
    },

    // Who originally submitted (for 'approved'/'rejected' entries)
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Fast lookup: full history for a piece of content
ReviewLogSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

module.exports = mongoose.model('ReviewLog', ReviewLogSchema);