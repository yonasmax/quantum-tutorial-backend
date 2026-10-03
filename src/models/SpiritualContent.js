const mongoose = require('mongoose');

const SpiritualContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bible', 'devotion', 'teaching', 'hymn', 'history', 'saint'],
    required: true
  },
  category: {
    type: String,
    enum: ['Old Testament', 'New Testament', 'Prayer', 'Doctrine', 'Hymn', 'Church History', 'Saints']
  },
  description: String,
  content: {
    type: String,
    required: true
  },
  amharicContent: {
    type: String,
    default: ''
  },
  author: String,
  reference: String,
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SpiritualContent', SpiritualContentSchema);