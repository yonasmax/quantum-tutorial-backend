const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// ================================================================
// Helper — build a date range from query
// ================================================================
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case '90d':
      start.setDate(now.getDate() - 90);
      break;
    case 'all':
    default:
      start.setFullYear(2024, 0, 1); // start of platform
      break;
  }
  return { start, end: now };
};

// ================================================================
// GET /api/analytics/overview
// Top-level KPIs
// ================================================================
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalCourses,
      totalLessons,
      totalExams,
      totalAttempts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Course.countDocuments(),
      Lesson.countDocuments(),
      Exam.countDocuments(),
      ExamAttempt.countDocuments({
        submittedAt: { $gte: start, $lte: end },
      }),
    ]);

    const payments = await Payment.find({
      status: 'confirmed',
      createdAt: { $gte: start, $lte: end },
    });
    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Pass rate
    const attempts = await ExamAttempt.find({
      submittedAt: { $gte: start, $lte: end },
      status: { $in: ['submitted', 'graded'] },
    });
    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate =
      attempts.length > 0
        ? Math.round((passedCount / attempts.length) * 100)
        : 0;

    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((s, a) => s + (a.percentage || 0), 0) /
              attempts.length
          )
        : 0;

    res.json({
      success: true,
      range,
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        totalCourses,
        totalLessons,
        totalExams,
        totalAttempts,
        totalRevenue,
        passRate,
        avgScore,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/analytics/user-growth
// Daily signups over the range
// ================================================================
router.get(
  '/user-growth',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { range = '30d' } = req.query;
      const { start, end } = getDateRange(range);

      const data = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.date',
            roles: {
              $push: { role: '$_id.role', count: '$count' },
            },
            total: { $sum: '$count' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const chart = data.map((d) => {
        const row = { date: d._id, total: d.total };
        d.roles.forEach((r) => {
          row[r.role] = r.count;
        });
        return row;
      });

      res.json({ success: true, chart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/analytics/top-lessons
// Most popular lessons (requires Lesson view tracking)
// ================================================================
router.get(
  '/top-lessons',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      // Simple approach: aggregate lessons with most exam attempts
      // (since we don't track lesson views yet)
      const lessons = await Lesson.find()
        .populate('course', 'title subject grade')
        .limit(10)
        .sort({ createdAt: -1 });

      const withStats = await Promise.all(
        lessons.map(async (lesson) => {
          const examCount = await Exam.countDocuments({
            subject: lesson.subject,
            grade: lesson.grade,
          });
          return {
            _id: lesson._id,
            title: lesson.title,
            subject: lesson.subject,
            grade: lesson.grade,
            courseTitle: lesson.course?.title || '—',
            examCount,
            status: lesson.status,
            createdAt: lesson.createdAt,
          };
        })
      );

      res.json({ success: true, lessons: withStats });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/analytics/exam-performance
// Pass rate + avg score per subject
// ================================================================
router.get(
  '/exam-performance',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { range = '30d' } = req.query;
      const { start, end } = getDateRange(range);

      const data = await ExamAttempt.aggregate([
        {
          $match: {
            submittedAt: { $gte: start, $lte: end },
            status: { $in: ['submitted', 'graded'] },
          },
        },
        {
          $lookup: {
            from: 'exams',
            localField: 'exam',
            foreignField: '_id',
            as: 'examData',
          },
        },
        { $unwind: '$examData' },
        {
          $group: {
            _id: '$examData.subject',
            attempts: { $sum: 1 },
            passed: { $sum: { $cond: ['$passed', 1, 0] } },
            avgPercentage: { $avg: '$percentage' },
          },
        },
        {
          $project: {
            subject: '$_id',
            attempts: 1,
            passed: 1,
            passRate: {
              $cond: [
                { $gt: ['$attempts', 0] },
                {
                  $round: [
                    { $multiply: [{ $divide: ['$passed', '$attempts'] }, 100] },
                    0,
                  ],
                },
                0,
              ],
            },
            avgPercentage: { $round: ['$avgPercentage', 0] },
          },
        },
        { $sort: { attempts: -1 } },
      ]);

      res.json({ success: true, chart: data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/analytics/revenue
// Daily revenue over the range
// ================================================================
router.get('/revenue', protect, authorize('admin'), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const { start, end } = getDateRange(range);

    const data = await Payment.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chart = data.map((d) => ({
      date: d._id,
      total: d.total,
      count: d.count,
    }));

    res.json({ success: true, chart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/analytics/top-teachers
// Teachers with most student exam attempts
// ================================================================
router.get(
  '/top-teachers',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const teachers = await User.find({ role: 'teacher' })
        .select('fullName email')
        .limit(10);

      const withStats = await Promise.all(
        teachers.map(async (t) => {
          const lessons = await Lesson.countDocuments({ createdBy: t._id });
          const exams = await Exam.countDocuments({ createdBy: t._id });
          const draftLessons = await Lesson.countDocuments({
            createdBy: t._id,
            status: 'draft',
          });
          return {
            _id: t._id,
            fullName: t.fullName,
            email: t.email,
            lessons,
            exams,
            draftLessons,
          };
        })
      );

      withStats.sort((a, b) => b.lessons + b.exams - (a.lessons + a.exams));

      res.json({ success: true, teachers: withStats });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/analytics/activity-heatmap
// When users are most active (24-hour distribution)
// ================================================================
router.get(
  '/activity-heatmap',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { range = '30d' } = req.query;
      const { start, end } = getDateRange(range);

      const data = await ExamAttempt.aggregate([
        {
          $match: {
            submittedAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$submittedAt' },
              dayOfWeek: { $dayOfWeek: '$submittedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
      ]);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const heatmap = [];

      for (let d = 1; d <= 7; d++) {
        for (let h = 0; h < 24; h++) {
          const found = data.find(
            (x) => x._id.dayOfWeek === d && x._id.hour === h
          );
          heatmap.push({
            day: days[d - 1],
            hour: h,
            count: found ? found.count : 0,
          });
        }
      }

      res.json({ success: true, heatmap });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/analytics/device-breakdown
// Mobile vs desktop (approximated from User-Agent data if available)
// ================================================================
router.get(
  '/device-breakdown',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      // Simplified — count by grade since we don't have UA storage yet
      const data = await User.aggregate([
        { $match: { role: 'student' } },
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const chart = data
        .filter((d) => d._id)
        .map((d) => ({
          grade: `Grade ${d._id}`,
          count: d.count,
        }));

      res.json({ success: true, chart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;