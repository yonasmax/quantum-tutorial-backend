const mongoose = require('mongoose');

const FundraisingProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  ngoName: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  contactPhone: String,
  goalAmount: {
    type: Number,
    required: true
  },
  raisedAmount: {
    type: Number,
    default: 0
  },
  imageUrl: String,
  category: {
    type: String,
    enum: ['education', 'health', 'emergency', 'community', 'environment', 'other']
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  donors: [{
    name: String,
    amount: Number,
    date: { type: Date, default: Date.now },
    anonymous: { type: Boolean, default: false }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FundraisingProject', FundraisingProjectSchema);