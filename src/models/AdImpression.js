const mongoose = require('mongoose');

const AdImpressionSchema = new mongoose.Schema(
  {
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: ['impression', 'click'],
      required: true,
    },
    placement: { type: String },
    page: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    referrer: { type: String },
  },
  { timestamps: true }
);

// Index for daily aggregations
AdImpressionSchema.index({ ad: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('AdImpression', AdImpressionSchema);