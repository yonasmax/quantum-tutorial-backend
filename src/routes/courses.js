// backend/src/routes/courses.js
// Self-contained course routes — list, detail, create, enroll, featured

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// ═══════════════════════════════════════════════════════════════
// COURSE MODEL (inline)
// ═══════════════════════════════════════════════════════════════
let Course;
try {
  Course = mongoose.model('Course');
} catch {
  const lessonSchema = new mongoose.Schema(
    {
      title: { type: String, default: '' },
      content: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      duration: { type: Number, default: 0 },
      order: { type: Number, default: 0 },
      objectives: [{ type: String }],
      keyTerms: [{ type: String }],
      quiz: {
        questions: [
          {
            question: String,
            options: [String],
            correctAnswer: Number,
            marks: { type: Number, default: 1 },
            explanation: String,
          },
        ],
        passingMarks: { type: Number, default: 50 },
      },
    },
    { timestamps: true }
  );

  const courseSchema = new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      subject: { type: String, required: true },
      grade: { type: String, default: '' },
      description: { type: String, default: '' },
      price: { type: Number, default: 0 },
      currency: { type: String, default: 'ETB' },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      lessons: [lessonSchema],
      isPublished: { type: Boolean, default: true },
      coverImage: { type: String, default: '' },
      thumbnail: { type: String, default: '' },
      studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
  );

  Course = mongoose.model('Course', courseSchema);
}

// ═══════════════════════════════════════════════════════════════
// OPTIONAL AUTH
// ═══════════════════════════════════════════════════════════════
async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret_change_me'
    );

    try {
      const User = mongoose.model('User');
      const user = await User.findById(decoded.id || decoded.userId).select('-password');
      if (user) req.user = user;
    } catch {
      req.user = { _id: decoded.id || decoded.userId };
    }
  } catch {}
  next();
}

// ═══════════════════════════════════════════════════════════════
// Helper: sort lessons by order field
// ═══════════════════════════════════════════════════════════════
function sortLessons(lessons) {
  if (!Array.isArray(lessons)) return [];
  return [...lessons].sort((a, b) => {
    const aOrder = typeof a.order === 'number' && a.order > 0 ? a.order : 9999;
    const bOrder = typeof b.order === 'number' && b.order > 0 ? b.order : 9999;
    return aOrder - bOrder;
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /api/courses — list courses
// ═══════════════════════════════════════════════════════════════
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { grade, subject, search } = req.query;
    const filter = {};

    if (grade) filter.grade = grade;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter)
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    const coursesWithMeta = courses.map((c) => {
      const isEnrolled =
        req.user && c.studentsEnrolled
          ? c.studentsEnrolled.some(
              (id) => id.toString() === req.user._id.toString()
            )
          : false;

      return {
        ...c,
        lessons: sortLessons(c.lessons),
        isEnrolled,
        lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0,
      };
    });

    res.json({
      success: true,
      count: coursesWithMeta.length,
      courses: coursesWithMeta,
    });
  } catch (err) {
    console.error('[courses] List error:', err.message);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/courses — create course
// ═══════════════════════════════════════════════════════════════
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, subject, grade, description, price, thumbnail } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ error: 'title and subject are required' });
    }

    const course = await Course.create({
      title,
      subject,
      grade: grade || '',
      description: description || '',
      price: price || 0,
      currency: 'ETB',
      teacher: req.user?._id || null,
      thumbnail: thumbnail || '',
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (err) {
    console.error('[courses] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/courses/featured
// ⚠️ MUST come before /:id
// ═══════════════════════════════════════════════════════════════
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    const courses = await Course.find({ isPublished: true })
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const coursesWithMeta = courses.map((c) => ({
      ...c,
      lessons: sortLessons(c.lessons),
      isEnrolled: false,
      lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0,
    }));

    res.json({
      success: true,
      count: coursesWithMeta.length,
      courses: coursesWithMeta,
    });
  } catch (err) {
    console.error('[courses] Featured error:', err.message);
    res.status(500).json({ error: 'Failed to load featured courses' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/courses/my/enrolled
// ⚠️ MUST come before /:id
// ═══════════════════════════════════════════════════════════════
router.get('/my/enrolled', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const courses = await Course.find({ studentsEnrolled: req.user._id })
      .populate('teacher', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (err) {
    console.error('[courses] My-enrolled error:', err.message);
    res.status(500).json({ error: 'Failed to load enrolled courses' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/courses/:id — single course (sorted lessons)
// ⚠️ MUST come after specific routes
// ═══════════════════════════════════════════════════════════════
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(req.params.id).populate(
      'teacher',
      'fullName email'
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isEnrolled =
      req.user && course.studentsEnrolled
        ? course.studentsEnrolled.some(
            (id) => id.toString() === req.user._id.toString()
          )
        : false;

    // ⭐ Sort lessons by their `order` field before returning
    const sortedLessons = sortLessons(course.lessons);

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        lessons: sortedLessons,
        isEnrolled,
        lessonCount: sortedLessons.length,
      },
    });
  } catch (err) {
    console.error('[courses] Get-one error:', err.message);
    res.status(500).json({ error: 'Failed to load course' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/courses/:id/enroll — enroll current user
// ═══════════════════════════════════════════════════════════════
router.post('/:id/enroll', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (course.studentsEnrolled.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    course.studentsEnrolled.push(req.user._id);
    await course.save();

    res.json({
      success: true,
      message: 'Successfully enrolled',
      courseId: course._id,
    });
  } catch (err) {
    console.error('[courses] Enroll error:', err.message);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

module.exports = router;