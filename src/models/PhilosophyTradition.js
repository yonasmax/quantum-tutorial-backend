const mongoose = require('mongoose');

const PhilosophyTraditionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['eastern', 'western', 'classics', 'poets', 'ethiopian', 'comparative'],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    nameGeez: { type: String, default: '' },
    nameAmharic: { type: String, default: '' },
    nameNative: { type: String, default: '' },

    icon: { type: String, default: '🏛️' },
    era: { type: String, default: '' },
    region: { type: String, default: '' },
    tradition: { type: String, default: '' },

    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },

    keyIdeas: [String],
    keyWorks: [
      {
        title: String,
        originalTitle: String,
        year: String,
        summary: String,
      },
    ],
    quotes: [
      {
        text: String,
        source: String,
        translation: String,
      },
    ],

    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhilosophyTradition', PhilosophyTraditionSchema);