// backend/src/routes/auth.js
// Self-contained authentication routes — register, login, me, forgot/reset password

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════════
// USER MODEL (inline — avoids external file dependency)
// ═══════════════════════════════════════════════════════════════
let User;
try {
  // Try to use existing model if already compiled
  User = mongoose.model('User');
} catch {
  // Otherwise define it inline
  const userSchema = new mongoose.Schema(
    {
      fullName: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: { type: String, required: true, minlength: 6 },
      role: {
        type: String,
        enum: ['student', 'teacher', 'parent', 'admin'],
        default: 'student',
      },
      grade: { type: String, default: null },
      phone: { type: String, default: null },
      parentEmail: { type: String, default: null },
      parentPhone: { type: String, default: null },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      rejectionReason: { type: String, default: null },
      isLocked: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      notificationsEnabled: { type: Boolean, default: true },
      enrolledCourses: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      ],
      subscription: {
        plan: { type: String, default: 'free' },
        expiresAt: { type: Date, default: null },
      },
      resetPasswordToken: { type: String, default: null },
      resetPasswordExpire: { type: Date, default: null },
    },
    { timestamps: true }
  );

  // Hash password before save
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  // Password comparison
  userSchema.methods.matchPassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
  };
  userSchema.methods.comparePassword = function (candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  User = mongoose.model('User', userSchema);
}

// ═══════════════════════════════════════════════════════════════
// PROTECT MIDDLEWARE (inline — avoids external file dependency)
// ═══════════════════════════════════════════════════════════════
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret_change_me'
    );
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const ALLOWED_SELF_REGISTER_ROLES = ['student', 'parent'];

// Safe email sender — logs to console if emailService is missing
async function trySendEmail(options) {
  try {
    const { sendEmail } = require('../services/emailService');
    await sendEmail(options);
    return true;
  } catch (err) {
    console.warn('[auth] Email service unavailable — skipping send:', err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      grade,
      phone,
      parentEmail,
      parentPhone,
    } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: 'fullName, email, and password are required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    if (role === 'teacher') {
      return res.status(403).json({
        error:
          'Teacher accounts are created by school administrators. Please contact your school admin.',
        code: 'TEACHER_SELF_REGISTRATION_BLOCKED',
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        error: 'Admin accounts cannot be self-registered.',
        code: 'ADMIN_SELF_REGISTRATION_BLOCKED',
      });
    }

    const safeRole = ALLOWED_SELF_REGISTER_ROLES.includes(role)
      ? role
      : 'student';

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res
        .status(400)
        .json({ error: 'User already exists with that email' });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      role: safeRole,
      grade: safeRole === 'student' ? grade || null : null,
      phone: phone || null,
      parentEmail: parentEmail || null,
      parentPhone: parentPhone || null,
      status: 'pending',
    });

    // Optional admin alert — ignored if email service not present
    await trySendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@quantum.et',
      subject: '🔔 New Registration Pending Approval',
      htmlContent: `<p>New user: ${user.fullName} (${user.email}) — Role: ${user.role}</p>`,
    });

    return res.status(201).json({
      success: true,
      requiresApproval: true,
      message:
        'Registration successful! Your account is awaiting admin approval. You will be notified once approved.',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[auth/register] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[auth/login] Attempt for:', email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      console.log('[auth/login] User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('[auth/login] Wrong password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ⚠️ DEV MODE: Comment out the pending check to test login immediately
    // Uncomment the block below in production:
    /*
    if (user.status === 'pending') {
      return res.status(403).json({
        error:
          'Your account is awaiting admin approval. Please wait for confirmation.',
        status: 'pending',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: user.rejectionReason
          ? `Your account was rejected. Reason: ${user.rejectionReason}`
          : 'Your account was rejected by the administrator.',
        status: 'rejected',
      });
    }

    if (user.isLocked) {
      return res
        .status(403)
        .json({ error: 'Your account has been locked. Contact admin.' });
    }
    */

    const token = generateToken(user._id);

    console.log('[auth/login] ✅ Success:', email);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        grade: user.grade,
        status: user.status,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    console.error('[auth/login] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET CURRENT USER
// ═══════════════════════════════════════════════════════════════
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      parentEmail,
      parentPhone,
      notificationsEnabled,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (parentEmail !== undefined) user.parentEmail = parentEmail;
    if (parentPhone !== undefined) user.parentPhone = parentPhone;
    if (notificationsEnabled !== undefined)
      user.notificationsEnabled = notificationsEnabled;

    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        notificationsEnabled: user.notificationsEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({
        success: true,
        message:
          'If an account exists with that email, a reset link has been sent.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const frontendUrl =
      process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    const sent = await trySendEmail({
      to: user.email,
      subject: '🔑 Password Reset — Quantum Center of Intellect',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fdfaf6; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #5a2e0a;">Quantum Center of Intellect</h1>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Click the link below to reset your password. It expires in 1 hour.</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background: #974F18; color: #fff8e7; text-decoration: none; border-radius: 8px;">🔑 Reset My Password</a></p>
          <p style="font-size: 12px; color: #7a5a3a;">Or copy: ${resetUrl}</p>
        </div>
      `,
    });

    if (!sent) {
      console.log('[auth/forgot-password] Reset URL (email not sent):', resetUrl);
    }

    res.json({
      success: true,
      message:
        'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[auth/forgot-password] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════════
router.put('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;