const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please add a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: [
        'student',
        'teacher',
        'admin',
        'parent',
        'ngo',
        'investor',
        'counselor',
      ],
      default: 'student',
    },
    phone: String,
    parentPhone: String,
    parentEmail: String,
    grade: {
      type: String,
      enum: ['5', '6', '7', '8', '9', '10', '11', '12', null, ''],
      default: null,
      required: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },

    // ⭐ Email notification preference
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // ⭐ Password reset (added today)
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    // ⭐ Account approval status
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'pending',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: {
      type: String,
      default: '',
    },

    subscription: {
      isActive: { type: Boolean, default: false },
      startDate: Date,
      expiryDate: Date,
      plan: { type: String, enum: ['monthly', 'yearly'] },
    },

    // ⭐ REMINDER PREFERENCES (Feature 5)
    reminderPreferences: {
      examUpcoming: { type: Boolean, default: true },
      examDeadline: { type: Boolean, default: true },
      lessonReview: { type: Boolean, default: true },
      contentReminder: { type: Boolean, default: true },
      feeDue: { type: Boolean, default: true },
      subscriptionExpiring: { type: Boolean, default: true },
      reEngagement: { type: Boolean, default: false }, // opt-in
      lastLoginAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);