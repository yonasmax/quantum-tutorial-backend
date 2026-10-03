const mongoose = require('mongoose');

const CounselingSessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionType: {
    type: String,
    enum: ['individual', 'group', 'emergency'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  preferredDate: Date,
  preferredTime: String,
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  notes: String,
  feedback: String
}, {
  timestamps: true
});

module.exports = mongoose.model('CounselingSession', CounselingSessionSchema);