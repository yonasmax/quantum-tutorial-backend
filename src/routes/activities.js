const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Quiz = require('../models/Quiz');
const { protect } = require('../middleware/auth');

// @desc   Get upcoming activities (exams + quizzes) for dashboard
// @route  GET /api/activities/upcoming
// @access Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const now = new Date();
    const gradeFilter = req.user.grade ? { grade: req.user.grade } : {};

    const [exams, quizzes] = await Promise.all([
      Exam.find({
        isActive: true,
        endDate: { $gte: now },
        ...gradeFilter,
      })
        .select('title subject grade startDate endDate duration')
        .sort({ startDate: 1 })
        .limit(limit),
      Quiz.find({
        isActive: true,
        ...gradeFilter,
      })
        .select('title subject grade duration createdAt')
        .sort({ createdAt: -1 })
        .limit(limit),
    ]);

    const activities = [
      ...exams.map((e) => ({
        type: 'exam',
        id: e._id,
        title: e.title,
        subject: e.subject,
        grade: e.grade,
        date: e.startDate,
        dueDate: e.endDate,
        duration: e.duration,
      })),
      ...quizzes.map((q) => ({
        type: 'quiz',
        id: q._id,
        title: q.title,
        subject: q.subject,
        grade: q.grade,
        date: q.createdAt,
        duration: q.duration,
      })),
    ]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);

    res.json({ success: true, count: activities.length, activities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;