const mongoose = require('mongoose');

const GeezProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alphabetMastered: [
      {
        char: String,
        attempts: Number,
        masteredAt: Date,
      },
    ],
    numbersMastered: [
      {
        value: Number,
        attempts: Number,
        masteredAt: Date,
      },
    ],
    chaptersCompleted: [
      {
        chapter: Number,
        completedAt: Date,
        score: Number,
      },
    ],
    currentChapter: { type: Number, default: 1 },
    lastActivity: Date,
    totalMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeezProgress', GeezProgressSchema);