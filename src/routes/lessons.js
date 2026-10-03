const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const ReviewLog = require('../models/ReviewLog');
const { protect, authorize } = require('../middleware/auth');
const requireCourseAccess = require('../middleware/requireCourseAccess');
const requireAssignment = require('../middleware/requireAssignment');
const requireSubscription = require('../middleware/requireSubscription');

// ═══════════════════════════════════════════════════════════════
// HELPER — Extract YouTube ID
// ═══════════════════════════════════════════════════════════════
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// HELPER — Strip client-side temp IDs
// ═══════════════════════════════════════════════════════════════
const stripTempIds = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (!item || typeof item !== 'object') return item;
    if (item._id && String(item._id).startsWith('temp_')) {
      const { _id, ...rest } = item;
      return rest;
    }
    return item;
  });
};

// ═══════════════════════════════════════════════════════════════
// GET /api/lessons/course/:courseId
// ═══════════════════════════════════════════════════════════════
router.get(
  '/course/:courseId',
  protect,
  requireCourseAccess,
  requireSubscription, // ⭐ NEW — blocks non-subscribed students
  async (req, res) => {
    try {
      const filter = { course: req.params.courseId };

      // Role-based scoping
      if (req.user.role === 'student' || req.user.role === 'parent') {
        filter.status = 'approved';
        filter.isPublished = true;
      } else if (req.user.role === 'teacher') {
        filter.$or = [{ status: 'approved' }, { createdBy: req.user._id }];
      } else if (req.user.role !== 'admin') {
        filter.status = 'approved';
        filter.isPublished = true;
      }

      const lessons = await Lesson.find(filter)
        .populate('createdBy', 'fullName')
        .sort({ order: 1, createdAt: 1 });

      // Cache for 5 minutes at edge
      res.setHeader(
        'Cache-Control',
        'private, s-maxage=300, stale-while-revalidate=86400'
      );

      res.json({ success: true, count: lessons.length, lessons });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// GET /api/lessons/:id
// ═══════════════════════════════════════════════════════════════
router.get(
  '/:id',
  protect,
  requireSubscription, // ⭐ NEW — blocks non-subscribed students
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id)
        .populate('createdBy', 'fullName')
        .populate('course', 'title subject grade');

      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      if (req.user.role === 'student' && lesson.status !== 'approved') {
        return res.status(403).json({ error: 'Lesson not available' });
      }

      if (req.user.role === 'teacher' && lesson.course) {
        const SubjectAssignment = require('../models/SubjectAssignment');
        const assignment = await SubjectAssignment.findOne({
          teacher: req.user._id,
          subject: lesson.course.subject,
          grade: lesson.course.grade,
          isActive: true,
        });
        const isOwner =
          lesson.createdBy &&
          lesson.createdBy._id &&
          lesson.createdBy._id.toString() === req.user._id.toString();

        if (!assignment && !isOwner) {
          return res.status(403).json({
            error: 'You do not have access to this lesson',
            code: 'NOT_ASSIGNED',
          });
        }
      }

      // Cache individual lesson for 5 minutes
      res.setHeader(
        'Cache-Control',
        'private, s-maxage=300, stale-while-revalidate=86400'
      );

      res.json({ success: true, lesson });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// POST /api/lessons — create
// ═══════════════════════════════════════════════════════════════
router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  requireAssignment,
  async (req, res) => {
    try {
      const {
        title,
        description,
        course,
        subject,
        grade,
        chapter,
        order,
        duration,
        objectives,
        notes,
        videoUrl,
        videoTitle,
        quiz,
        status,
      } = req.body;

      if (!title || !course) {
        return res.status(400).json({ error: 'title and course are required' });
      }

      const courseDoc = await Course.findById(course);
      if (!courseDoc) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const lesson = await Lesson.create({
        title,
        description: description || '',
        course,
        subject: subject || courseDoc.subject,
        grade: grade || courseDoc.grade,
        chapter: chapter || 'Unit 1',
        order: order || 0,
        duration: duration || 10,
        objectives: Array.isArray(objectives)
          ? objectives.filter(Boolean)
          : [],
        notes: stripTempIds(notes),
        videoUrl: videoUrl || '',
        videoTitle: videoTitle || '',
        quiz: {
          questions: stripTempIds(quiz?.questions),
          passingMarks: quiz?.passingMarks || 50,
          showAnswersImmediately: quiz?.showAnswersImmediately !== false,
        },
        status: status === 'pendingReview' ? 'draft' : status || 'draft',
        createdBy: req.user._id,
      });

      if (!courseDoc.lessons.includes(lesson._id)) {
        courseDoc.lessons.push(lesson._id);
        await courseDoc.save();
      }

      res.status(201).json({ success: true, lesson });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// PUT /api/lessons/:id — update
// ═══════════════════════════════════════════════════════════════
router.put(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      if (
        req.user.role !== 'admin' &&
        String(lesson.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your lesson' });
      }

      if (req.user.role === 'teacher') {
        const SubjectAssignment = require('../models/SubjectAssignment');
        const assignment = await SubjectAssignment.findOne({
          teacher: req.user._id,
          subject: lesson.subject,
          grade: lesson.grade,
          isActive: true,
        });
        if (!assignment) {
          return res.status(403).json({
            error: `You are no longer assigned to ${lesson.subject} — Grade ${lesson.grade}.`,
            code: 'NOT_ASSIGNED',
          });
        }
      }

      if (
        req.user.role !== 'admin' &&
        !['draft', 'rejected'].includes(lesson.status)
      ) {
        return res.status(400).json({
          error: `Cannot edit lesson in status "${lesson.status}"`,
        });
      }

      if (req.body.videoUrl !== undefined) {
        req.body.videoUrl = req.body.videoUrl || '';
      }

      if (req.body.notes) {
        req.body.notes = stripTempIds(req.body.notes);
      }
      if (req.body.quiz?.questions) {
        req.body.quiz.questions = stripTempIds(req.body.quiz.questions);
      }

      Object.assign(lesson, req.body);
      if (lesson.status === 'rejected') lesson.status = 'draft';
      await lesson.save();

      res.json({ success: true, lesson });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// POST /api/lessons/:id/submit-for-review
// ═══════════════════════════════════════════════════════════════
router.post(
  '/:id/submit-for-review',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      if (
        req.user.role !== 'admin' &&
        String(lesson.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your lesson' });
      }

      if (!['draft', 'rejected'].includes(lesson.status)) {
        return res.status(400).json({
          error: `Cannot submit from status "${lesson.status}"`,
        });
      }

      lesson.status = 'pendingReview';
      lesson.submittedBy = req.user._id;
      lesson.submittedAt = new Date();
      lesson.reviewReason = '';
      await lesson.save();

      await ReviewLog.create({
        contentType: 'lesson',
        contentId: lesson._id,
        contentTitle: lesson.title,
        action: 'submitted',
        actor: req.user._id,
        actorRole: req.user.role,
        submittedBy: req.user._id,
      });

      res.json({ success: true, message: 'Submitted for review', lesson });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// DELETE /api/lessons/:id
// ═══════════════════════════════════════════════════════════════
router.delete(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id);
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      if (
        req.user.role !== 'admin' &&
        String(lesson.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your lesson' });
      }

      await Course.findByIdAndUpdate(lesson.course, {
        $pull: { lessons: lesson._id },
      });

      await lesson.deleteOne();
      res.json({ success: true, message: 'Lesson deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// POST /api/lessons/youtube-preview
// ═══════════════════════════════════════════════════════════════
router.post(
  '/youtube-preview',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { url } = req.body;
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }
      res.json({
        success: true,
        videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;