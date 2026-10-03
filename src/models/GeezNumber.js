const mongoose = require('mongoose');

const GeezNumberSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true, unique: true, index: true },
    symbol: { type: String, required: true },
    amharicWord: { type: String, required: true },
    geezWord: { type: String, required: true },
    category: {
      type: String,
      enum: ['መሠረታዊ', 'ዐሥርት', 'መቶአት', 'ሺዎች', 'እልፍ', 'ሚሊዮን'],
      required: true,
    },
    note: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeezNumber', GeezNumberSchema);