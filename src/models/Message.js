const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },

    // Content
    text: {
      type: String,
      default: '',
      maxlength: 5000,
    },

    // Optional attachment
    attachment: {
      url: { type: String, default: '' },
      type: {
        type: String,
        enum: ['image', 'pdf', 'doc', 'other', ''],
        default: '',
      },
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },

    // Read status
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: { type: Date, default: Date.now },
      },
    ],

    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);