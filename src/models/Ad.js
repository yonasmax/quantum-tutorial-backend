const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema(
  {
    // Advertiser info
    advertiserName: {
      type: String,
      required: true,
      trim: true,
    },
    advertiserEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    advertiserPhone: {
      type: String,
      default: '',
    },

    // Ad content
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
    },
    ctaText: {
      type: String,
      default: 'Learn More',
    },

    // Placement
    placement: {
      type: String,
      enum: ['sidebar', 'banner', 'inline', 'dashboard', 'popup'],
      default: 'sidebar',
      index: true,
    },

    // Targeting
    targetGrades: {
      type: [String],
      default: [], // empty = all grades
    },
    targetSubjects: {
      type: [String],
      default: [], // empty = all subjects
    },
    targetRoles: {
      type: [String],
      enum: ['student', 'teacher', 'parent', 'admin'],
      default: [],
    },

    // Schedule
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Pricing / contract
    plan: {
      type: String,
      enum: ['starter', 'standard', 'premium'],
      default: 'starter',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paused', 'expired'],
      default: 'pending',
      index: true,
    },

    // Moderation
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },

    // Performance metrics
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dailyImpressions: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index: find active ads by placement
AdSchema.index({ status: 1, placement: 1, startDate: 1, endDate: 1 });

// Virtual: CTR
AdSchema.virtual('ctr').get(function () {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

AdSchema.set('toJSON', { virtuals: true });
AdSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ad', AdSchema);