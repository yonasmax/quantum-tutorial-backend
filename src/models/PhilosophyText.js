const mongoose = require('mongoose');

const PhilosophyTextSchema = new mongoose.Schema(
  {
    tradition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhilosophyTradition',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    author: { type: String, default: '' },
    excerptNumber: { type: Number, default: 0 },
    originalLanguage: { type: String, default: '' },

    originalText: { type: String, default: '' },
    amharicTranslation: { type: String, default: '' },
    englishTranslation: { type: String, default: '' },

    commentary: { type: String, default: '' },
    discussionQuestions: [String],

    readingMinutes: { type: Number, default: 5 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhilosophyText', PhilosophyTextSchema);