const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // Who's chatting
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],

    // Cached participant info (for quick display)
    participantsInfo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        fullName: String,
        role: String,
        avatar: String,
      },
    ],

    // Last message preview (denormalized for fast inbox display)
    lastMessage: {
      text: { type: String, default: '' },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      senderName: { type: String, default: '' },
      sentAt: { type: Date, default: null },
      hasAttachment: { type: Boolean, default: false },
    },

    // Unread counts per user (map userId -> count)
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    // Soft delete per user (map userId -> deleted date)
    deletedFor: {
      type: Map,
      of: Date,
      default: {},
    },

    // Context — optional subject/grade the chat is about
    subject: { type: String, default: '' },
    grade: { type: String, default: '' },

    // Status
    isActive: { type: Boolean, default: true },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index: find conversations for a specific user
ConversationSchema.index({ participants: 1, lastActivityAt: -1 });

// Find a conversation between two users
ConversationSchema.statics.findBetween = async function (userA, userB) {
  return this.findOne({
    participants: { $all: [userA, userB] },
    isActive: true,
  });
};

module.exports = mongoose.model('Conversation', ConversationSchema);