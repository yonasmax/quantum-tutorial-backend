const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'submitted',
        'confirmed',
        'rejected',
        'failed',
        'refunded',
      ],
      default: 'pending',
    },
    transactionId: String,
    receiveCode: String,
    merchantNumber: {
      type: String,
      default: '+251921639261',
    },

    // ================================================================
    // TELEBIRR API DATA
    // ================================================================
    telebirrPrepayId: {
      type: String,
      default: '',
    },
    telebirrRawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    telebirrNotifyPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ================================================================
    // PROOF SUBMISSION (manual fallback)
    // ================================================================
    screenshotUrl: {
      type: String,
      default: '',
    },
    submittedAt: Date,

    // ================================================================
    // ADMIN VERIFICATION
    // ================================================================
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNote: {
      type: String,
      default: '',
    },
    confirmedAt: Date,

    // ================================================================
    // REJECTION
    // ================================================================
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ status: 1, submittedAt: 1 });
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);