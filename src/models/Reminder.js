const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    // Who should receive this reminder
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'admin'],
      required: true,
    },

    // What is this reminder about?
    type: {
      type: String,
      enum: [
        'exam-upcoming',      // exam starts soon
        'exam-deadline',      // exam ends soon
        'lesson-review',      // teacher has drafts pending
        'content-reminder',   // teacher hasn't created content in X days
        'fee-due',            // student fee due
        'subscription-expiring', // subscription ending
        're-engagement',      // user hasn't logged in for X days
        'custom',             // manual admin reminder
      ],
      required: true,
      index: true,
    },

    // Reference object (optional)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Exam', 'Lesson', 'Payment', 'Subscription', null],
      default: null,
    },

    // Content
    subject: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },

    // Scheduling
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index: find pending reminders scheduled before a time
ReminderSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Reminder', ReminderSchema);