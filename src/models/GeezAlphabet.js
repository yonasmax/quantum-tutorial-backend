const mongoose = require('mongoose');

const GeezAlphabetSchema = new mongoose.Schema(
  {
    char: { type: String, required: true, unique: true, index: true },
    order: { type: Number, required: true, index: true },
    family: {
      type: String,
      enum: ['ሆይ', 'ሐለ', 'ሐርመ', 'ሠደይ', 'ዲቃላ'],
      required: true,
    },
    forms: {
      ግዕዝ: { type: String, required: true },
      ካዕብ: { type: String, required: true },
      ሣልስ: { type: String, required: true },
      ራብዕ: { type: String, required: true },
      ሓምስ: { type: String, required: true },
      ሳድስ: { type: String, required: true },
      ሳብዕ: { type: String, required: true },
    },
    hasFullSeven: { type: Boolean, default: true },
    pronunciation: {
      am: String,
      en: String,
    },
    exampleWord: {
      geez: String,
      amharic: String,
      english: String,
    },
    audioUrl: String,
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeezAlphabet', GeezAlphabetSchema);