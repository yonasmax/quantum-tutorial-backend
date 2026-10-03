const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add company name'],
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkUrl: String,
  category: {
    type: String,
    enum: ['education', 'tech', 'finance', 'health', 'retail', 'service', 'other']
  },
  position: {
    type: String,
    enum: ['top', 'sidebar', 'bottom', 'popup']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: Date,
  endDate: Date,
  clicks: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  contactEmail: String,
  contactPhone: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);