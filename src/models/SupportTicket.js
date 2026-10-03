const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, default: 'guest' },

    category: {
      type: String,
      enum: ['bug', 'payment', 'course', 'account', 'geez', 'philosophy', 'other'],
      default: 'other',
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    adminNote: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,

    // Browser metadata (auto-captured)
    userAgent: { type: String, default: '' },
    pageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);