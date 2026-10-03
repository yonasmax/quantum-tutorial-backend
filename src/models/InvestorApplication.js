const mongoose = require('mongoose');

const InvestorApplicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add full name'],
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: String,
  company: String,
  title: String,
  investmentAmount: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  interestAreas: [{
    type: String,
    enum: ['education', 'technology', 'edtech', 'social impact', 'other']
  }],
  status: {
    type: String,
    enum: ['pending', 'contacted', 'approved', 'rejected'],
    default: 'pending'
  },
  respondedAt: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('InvestorApplication', InvestorApplicationSchema);