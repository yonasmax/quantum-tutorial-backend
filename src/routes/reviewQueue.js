const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Exam = require('../models/Exam');
const Lesson = require('../models/Lesson');
const ReviewLog = require('../models/ReviewLog');
const { protect, authorize } = require('../middleware/auth');

// ================================================================
// Helper — write a ReviewLog entry
// ================================================================
const logAction = async ({
  contentType,
  contentId,
  contentTitle,
  action,
  actor,
  reason = '',
  submittedBy,
}) => {
  await ReviewLog.create({
    contentType,
    contentId,
    contentTitle,
    action,
    actor: actor._id,
    actorRole: actor.role,
    reason,
    submittedBy,
  });
};

// ================================================================
// GET /api/review-queue — list all pending items (admin only)
// ================================================================
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const [quizzes, exams, lessons] = await Promise.all([
      Quiz.find({ status: 'pendingReview' })
        .populate('createdBy', 'fullName email')
        .sort({ submittedAt: 1 }),
      Exam.find({ status: 'pendingReview' })
        .populate('createdBy', 'fullName email')
        .sort({ submittedAt: 1 }),
      Lesson.find({ status: 'pendingReview' })
        .populate('createdBy', 'fullName email')
        .sort({ submittedAt: 1 }),
    ]);

    const items = [
      ...quizzes.map((q) => ({
        contentType: 'quiz',
        id: q._id,
        title: q.title,
        subject: q.subject,
        grade: q.grade,
        submittedAt: q.submittedAt,
        submittedBy: q.createdBy,
        questionCount: q.questions?.length || 0,
      })),
      ...exams.map((e) => ({
        contentType: 'exam',
        id: e._id,
        title: e.title,
        subject: e.subject,
        grade: e.grade,
        submittedAt: e.submittedAt,
        submittedBy: e.createdBy,
        questionCount: e.questions?.length || 0,
      })),
      ...lessons.map((l) => ({
        contentType: 'lesson',
        id: l._id,
        title: l.title,
        subject: l.subject,
        grade: l.grade,
        submittedAt: l.submittedAt,
        submittedBy: l.createdBy,
      })),
    ].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/review-queue/:contentType/:id/approve
// ================================================================
router.post(
  '/:contentType/:id/approve',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { contentType, id } = req.params;

      const Model = {
        quiz: Quiz,
        exam: Exam,
        lesson: Lesson,
      }[contentType];

      if (!Model) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const doc = await Model.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Content not found' });
      }
      if (doc.status !== 'pendingReview') {
        return res.status(400).json({
          error: `Cannot approve — content is in status "${doc.status}"`,
        });
      }

      doc.status = 'approved';
      doc.reviewedBy = req.user._id;
      doc.reviewedAt = new Date();
      doc.reviewReason = '';
      if (contentType === 'lesson') doc.isPublished = true;
      await doc.save();

      await logAction({
        contentType,
        contentId: doc._id,
        contentTitle: doc.title,
        action: 'approved',
        actor: req.user,
        submittedBy: doc.submittedBy || doc.createdBy,
      });

      res.json({ success: true, message: 'Approved', item: doc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// POST /api/review-queue/:contentType/:id/reject
// ================================================================
router.post(
  '/:contentType/:id/reject',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { contentType, id } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const Model = {
        quiz: Quiz,
        exam: Exam,
        lesson: Lesson,
      }[contentType];

      if (!Model) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const doc = await Model.findById(id);
      if (!doc) {
        return res.status(404).json({ error: 'Content not found' });
      }
      if (doc.status !== 'pendingReview') {
        return res.status(400).json({
          error: `Cannot reject — content is in status "${doc.status}"`,
        });
      }

      doc.status = 'rejected';
      doc.reviewedBy = req.user._id;
      doc.reviewedAt = new Date();
      doc.reviewReason = reason;
      await doc.save();

      await logAction({
        contentType,
        contentId: doc._id,
        contentTitle: doc.title,
        action: 'rejected',
        actor: req.user,
        reason,
        submittedBy: doc.submittedBy || doc.createdBy,
      });

      res.json({ success: true, message: 'Rejected', item: doc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// GET /api/review-queue/history/:contentType/:id
// ================================================================
router.get(
  '/history/:contentType/:id',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const logs = await ReviewLog.find({
        contentType: req.params.contentType,
        contentId: req.params.id,
      })
        .populate('actor', 'fullName role')
        .populate('submittedBy', 'fullName role')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: logs.length, logs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;