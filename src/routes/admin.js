// ═══════════════════════════════════════════════════════════════
// MULTER + CLOUDINARY for teacher photo upload
// ═══════════════════════════════════════════════════════════════
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Configure multer to store files in memory (buffer → Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const SubjectAssignment = require('../models/SubjectAssignment');
const { sendTeacherWelcome, sendPasswordReset } = require('../services/emailService');
const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

// ================================================================
// ADMIN CHECK MIDDLEWARE
// ================================================================
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ================================================================
// GET DASHBOARD STATS
// ================================================================
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalParents = await User.countDocuments({ role: 'parent' });
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalExams = await Exam.countDocuments();
    const totalExamResults = await ExamResult.countDocuments();

    const payments = await Payment.find({ status: 'confirmed' });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeSubs = await Subscription.countDocuments({
      isActive: true,
      endDate: { $gt: new Date() },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: weekAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalParents,
        totalCourses,
        totalLessons,
        totalExams,
        totalExamResults,
        totalRevenue,
        activeSubs,
        recentSignups,
        totalTransactions: payments.length,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL USERS
// ================================================================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { role, search, isLocked } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isLocked !== undefined) query.isLocked = isLocked === 'true';
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET SINGLE USER
// ================================================================
router.get('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// LOCK / UNLOCK USER
// ================================================================
router.put('/users/:id/lock', protect, adminOnly, async (req, res) => {
  try {
    const { isLocked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked: !!isLocked },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${isLocked ? 'locked' : 'unlocked'} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// DELETE USER
// ================================================================
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// CREATE NEW STUDENT
// ================================================================
router.post('/students/create', protect, adminOnly, async (req, res) => {
  try {
    const { fullName, email, password, grade, parentEmail, parentPhone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role: 'student',
      grade,
      parentEmail,
      parentPhone,
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL COURSES
// ================================================================
router.get('/courses', protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL EXAMS
// ================================================================
router.get('/exams', protect, adminOnly, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    const examsWithResults = await Promise.all(
      exams.map(async (exam) => {
        const resultCount = await ExamResult.countDocuments({ exam: exam._id });
        return { ...exam.toObject(), resultCount };
      })
    );

    res.json({
      success: true,
      count: exams.length,
      exams: examsWithResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL PAYMENTS
// ================================================================
router.get('/payments', protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'fullName email')
      .populate('student', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(200);

    const totalRevenue = payments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      count: payments.length,
      totalRevenue,
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// GET ALL SUBSCRIPTIONS
// ================================================================
router.get('/subscriptions', protect, adminOnly, async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================================================================
// PENDING USER APPROVAL
// ================================================================
router.get('/pending-users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.status !== 'pending') {
      return res.status(400).json({ error: `User is already ${user.status}` });
    }

    user.status = 'active';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    user.rejectionReason = '';
    await user.save();

    try {
      const { sendAccountApproved } = require('../services/emailService');
      await sendAccountApproved(user);
    } catch (emailErr) {
      console.error('Approval email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'User approved', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.status !== 'pending') {
      return res.status(400).json({ error: `User is already ${user.status}` });
    }

    user.status = 'rejected';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    user.rejectionReason = reason;
    await user.save();

    try {
      const { sendAccountRejected } = require('../services/emailService');
      await sendAccountRejected(user, reason);
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'User rejected', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// TEACHER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// @desc    Create a teacher account (with optional photo)
// @route   POST /api/admin/teachers
// @access  Admin
router.post(
  '/teachers',
  protect,
  authorize('admin'),
  upload.single('photo'),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        password,
        parentEmail,
        parentPhone,
        assignments,
      } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({
          error: 'fullName, email, and password are required',
        });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: 'Password must be at least 6 characters' });
      }

      // ⭐ Assignments come as a JSON string when sent via FormData
      let parsedAssignments = [];
      if (typeof assignments === 'string') {
        try {
          parsedAssignments = JSON.parse(assignments);
        } catch (e) {
          parsedAssignments = [];
        }
      } else if (Array.isArray(assignments)) {
        parsedAssignments = assignments;
      }

      if (!Array.isArray(parsedAssignments) || parsedAssignments.length === 0) {
        return res.status(400).json({
          error: 'At least one subject + grade assignment is required',
        });
      }

      for (const a of parsedAssignments) {
        if (!a.subject || !a.grade) {
          return res
            .status(400)
            .json({ error: 'Each assignment must have subject and grade' });
        }
      }

      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res
          .status(400)
          .json({ error: 'A user with that email already exists' });
      }

      // ⭐ Upload photo to Cloudinary (if provided)
      let avatarUrl = '';
      let photoCapturedAt = null;
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'quantum-tutorial/teachers',
              resource_type: 'image',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        avatarUrl = uploadResult.secure_url;
        photoCapturedAt = new Date();
      }

      const teacher = await User.create({
        fullName,
        email: email.toLowerCase(),
        phone: phone || '',
        parentEmail: parentEmail || '',
        parentPhone: parentPhone || '',
        password,
        role: 'teacher',
        status: 'active',
        grade: null,
        avatar: avatarUrl,
        photoUrl: avatarUrl,
        photoCapturedAt,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      });

      const createdAssignments = [];
      for (const a of parsedAssignments) {
        const dup = await SubjectAssignment.findOne({
          teacher: teacher._id,
          subject: a.subject,
          grade: a.grade,
        });
        if (dup) continue;

        const assignment = await SubjectAssignment.create({
          teacher: teacher._id,
          subject: a.subject,
          grade: a.grade,
          assignedBy: req.user._id,
          isActive: true,
        });
        createdAssignments.push(assignment);
      }

      try {
        await sendTeacherWelcome(teacher, password, createdAssignments);
      } catch (emailErr) {
        console.error('Welcome email failed:', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: `Teacher created with ${createdAssignments.length} assignment(s)`,
        teacher: {
          _id: teacher._id,
          fullName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone,
          role: teacher.role,
          status: teacher.status,
          avatar: teacher.avatar,
          photoUrl: teacher.photoUrl,
        },
        assignments: createdAssignments,
      });
    } catch (err) {
      console.error('Create teacher error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// @desc    List all teachers
// @route   GET /api/admin/teachers
// @access  Admin
router.get('/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 });

    const withAssignments = await Promise.all(
      teachers.map(async (t) => {
        const assignments = await SubjectAssignment.find({
          teacher: t._id,
        }).sort({ subject: 1, grade: 1 });
        return { ...t.toObject(), assignments };
      })
    );

    res.json({
      success: true,
      count: withAssignments.length,
      teachers: withAssignments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Get single teacher
// @route   GET /api/admin/teachers/:id
// @access  Admin
router.get('/teachers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher',
    }).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const assignments = await SubjectAssignment.find({
      teacher: teacher._id,
    }).sort({ subject: 1, grade: 1 });

    res.json({
      success: true,
      teacher: {
        ...teacher.toObject(),
        assignments,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Update teacher info + assignments
// @route   PUT /api/admin/teachers/:id
// @access  Admin
router.put(
  '/teachers/:id',
  protect,
  authorize('admin'),
  upload.single('photo'),
  async (req, res) => {
    try {
      const { fullName, phone, parentEmail, parentPhone, assignments } = req.body;

      const teacher = await User.findOne({
        _id: req.params.id,
        role: 'teacher',
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      if (fullName) teacher.fullName = fullName;
      if (phone !== undefined) teacher.phone = phone;
      if (parentEmail !== undefined) teacher.parentEmail = parentEmail;
      if (parentPhone !== undefined) teacher.parentPhone = parentPhone;

      // ⭐ Optional: update photo if a new one was uploaded
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'quantum-tutorial/teachers',
              resource_type: 'image',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        teacher.avatar = uploadResult.secure_url;
        teacher.photoUrl = uploadResult.secure_url;
        teacher.photoCapturedAt = new Date();
      }

      await teacher.save();

      let parsedAssignments = [];
      if (typeof assignments === 'string') {
        try {
          parsedAssignments = JSON.parse(assignments);
        } catch (e) {
          parsedAssignments = [];
        }
      } else if (Array.isArray(assignments)) {
        parsedAssignments = assignments;
      }

      if (Array.isArray(parsedAssignments) && parsedAssignments.length > 0) {
        // Deactivate old
        await SubjectAssignment.updateMany(
          { teacher: teacher._id },
          { $set: { isActive: false } }
        );

        // Add/reactivate new
        for (const a of parsedAssignments) {
          if (!a.subject || !a.grade) continue;
          const existing = await SubjectAssignment.findOne({
            teacher: teacher._id,
            subject: a.subject,
            grade: a.grade,
          });
          if (existing) {
            existing.isActive = true;
            await existing.save();
          } else {
            await SubjectAssignment.create({
              teacher: teacher._id,
              subject: a.subject,
              grade: a.grade,
              assignedBy: req.user._id,
              isActive: true,
            });
          }
        }
      }

      const updatedAssignments = await SubjectAssignment.find({
        teacher: teacher._id,
        isActive: true,
      });

      res.json({
        success: true,
        message: 'Teacher updated',
        teacher: {
          _id: teacher._id,
          fullName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone,
          role: teacher.role,
          status: teacher.status,
          avatar: teacher.avatar,
          photoUrl: teacher.photoUrl,
        },
        assignments: updatedAssignments,
      });
    } catch (err) {
      console.error('Update teacher error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// @desc    Reset a teacher's password
// @route   POST /api/admin/teachers/:id/reset-password
// @access  Admin
router.post(
  '/teachers/:id/reset-password',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: 'newPassword is required (min 6 characters)' });
      }

      const teacher = await User.findOne({
        _id: req.params.id,
        role: 'teacher',
      }).select('+password');

      if (!teacher)
        return res.status(404).json({ error: 'Teacher not found' });

      teacher.password = newPassword;
      await teacher.save();

      try {
        await sendPasswordReset(teacher, newPassword);
      } catch (e) {
        console.error('Reset email failed:', e.message);
      }

      res.json({ success: true, message: 'Password reset and emailed' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// @desc    Disable / enable a teacher
// @route   PUT /api/admin/teachers/:id/disable
// @access  Admin
router.put(
  '/teachers/:id/disable',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { isDisabled } = req.body;
      const teacher = await User.findOne({
        _id: req.params.id,
        role: 'teacher',
      });
      if (!teacher)
        return res.status(404).json({ error: 'Teacher not found' });

      teacher.isLocked = !!isDisabled;
      await teacher.save();

      if (isDisabled) {
        await SubjectAssignment.updateMany(
          { teacher: teacher._id },
          { $set: { isActive: false } }
        );
      }

      res.json({
        success: true,
        message: isDisabled ? 'Teacher disabled' : 'Teacher enabled',
        isLocked: teacher.isLocked,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc    Delete a teacher
// @route   DELETE /api/admin/teachers/:id
// @access  Admin
router.delete(
  '/teachers/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const teacher = await User.findOne({
        _id: req.params.id,
        role: 'teacher',
      });
      if (!teacher)
        return res.status(404).json({ error: 'Teacher not found' });

      await SubjectAssignment.deleteMany({ teacher: teacher._id });
      await teacher.deleteOne();

      res.json({ success: true, message: 'Teacher deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;