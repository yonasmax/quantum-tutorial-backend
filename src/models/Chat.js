const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      maxlength: 120,
    },
    subject: {
      type: String,
      default: 'General',
    },
    grade: {
      type: String,
      default: '9',
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

ChatSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);