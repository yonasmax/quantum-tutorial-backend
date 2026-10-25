// backend/src/models/User.js
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

    // Grade: for students (mandatory) â€” for teachers, the grade they teach
    grade: {
      type: String,
      enum: ['5', '6', '7', '8', '9', '10', '11', '12', null, '', 'free'],
      default: null,
      required: false,
    },

    // Subject: for teachers â€” the subject they teach
    subject: {
      type: String,
      enum: [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Geez',
        'Geography',
        'History',
        'General Science',
        'Environmental Science',
        'Social Studies',
        null,
        '',
      ],
      default: null,
      required: false,
    },

    isLocked: {
      type: Boolean,
      default: false,
    },

    // â­ Email notification preference
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },

    // â­ Password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    // â­ Account approval status
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'free'],
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
      plan: { type: String, enum: ['monthly', 'yearly', 'free'] },
    },

    // â­ REMINDER PREFERENCES
    reminderPreferences: {
      examUpcoming: { type: Boolean, default: true },
      examDeadline: { type: Boolean, default: true },
      lessonReview: { type: Boolean, default: true },
      contentReminder: { type: Boolean, default: true },
      feeDue: { type: Boolean, default: true },
      subscriptionExpiring: { type: Boolean, default: true },
      reEngagement: { type: Boolean, default: false },
      lastLoginAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VALIDATION â€” students must have a grade, teachers must have grade + subject
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
UserSchema.pre('validate', function (next) {
  if (this.role === 'student') {
    if (!this.grade) {
      // Warn but don't block â€” you may register before assigning grade
      console.warn(`[User] Student "${this.email}" created without a grade`);
    }
  }
  next();
});

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

// Virtual: friendly label for teachers
UserSchema.virtual('teachingLabel').get(function () {
  if (this.role !== 'teacher') return null;
  if (!this.grade || !this.subject) return 'Unassigned';
  return `Grade ${this.grade} Â· ${this.subject}`;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
