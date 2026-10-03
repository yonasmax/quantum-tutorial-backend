const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ReviewLog = require('../models/ReviewLog');
const { protect, authorize } = require('../middleware/auth');
const requireAssignment = require('../middleware/requireAssignment');

// @desc   Get all quizzes
// @route  GET /api/quizzes
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const { grade, subject, course, status } = req.query;
    const filter = { isActive: true };

    // Students only see APPROVED quizzes for their grade
    if (req.user.role === 'student') {
      if (req.user.grade) filter.grade = req.user.grade;
      filter.status = 'approved';
    } else {
      // Teachers see their OWN drafts + all approved
      // Admins see everything
      if (req.user.role === 'admin') {
        if (status) filter.status = status;
        else filter.status = { $in: ['draft', 'pendingReview', 'approved', 'rejected'] };
      } else if (req.user.role === 'teacher') {
        if (status) {
          filter.status = status;
          filter.createdBy = req.user._id; // teachers only see their own drafts
        } else {
          filter.$or = [
            { status: 'approved' },
            { createdBy: req.user._id },
          ];
        }
      }
      if (grade) filter.grade = grade;
    }

    if (subject) filter.subject = subject;
    if (course) filter.course = course;

    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'fullName')
      .populate('course', 'title subject grade')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Get one quiz
// @route  GET /api/quizzes/:id
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('course', 'title');

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Students can only view approved quizzes
    if (req.user.role === 'student' && quiz.status !== 'approved') {
      return res.status(403).json({ error: 'Quiz not available' });
    }

    res.json({ success: true, quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Create a quiz (teacher must be assigned)
// @route  POST /api/quizzes
// @access Teacher/Admin
router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  requireAssignment,
  async (req, res) => {
    try {
      const { title, subject, grade, questions, totalMarks, ...rest } = req.body;

      if (!questions || questions.length === 0) {
        return res.status(400).json({ error: 'Add at least one question' });
      }

      const computedTotal =
        totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);

      const quiz = await Quiz.create({
        title,
        subject,
        grade,
        questions,
        totalMarks: computedTotal,
        ...rest,
        createdBy: req.user._id,
        status: 'draft', // always starts as draft
      });

      res.status(201).json({ success: true, quiz });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// @desc   Update a quiz (only own drafts)
// @route  PUT /api/quizzes/:id
// @access Teacher/Admin
router.put(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

      if (
        req.user.role !== 'admin' &&
        String(quiz.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your quiz' });
      }

      if (
        req.user.role !== 'admin' &&
        !['draft', 'rejected'].includes(quiz.status)
      ) {
        return res.status(400).json({
          error: `Cannot edit quiz in status "${quiz.status}"`,
        });
      }

      Object.assign(quiz, req.body);
      // When a rejected quiz is edited, push it back to draft
      if (quiz.status === 'rejected') quiz.status = 'draft';
      await quiz.save();

      res.json({ success: true, quiz });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// @desc   Submit a quiz for review
// @route  POST /api/quizzes/:id/submit-for-review
// @access Teacher/Admin
router.post(
  '/:id/submit-for-review',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

      if (
        req.user.role !== 'admin' &&
        String(quiz.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your quiz' });
      }

      if (!['draft', 'rejected'].includes(quiz.status)) {
        return res.status(400).json({
          error: `Cannot submit for review from status "${quiz.status}"`,
        });
      }

      quiz.status = 'pendingReview';
      quiz.submittedBy = req.user._id;
      quiz.submittedAt = new Date();
      quiz.reviewReason = '';
      await quiz.save();

      await ReviewLog.create({
        contentType: 'quiz',
        contentId: quiz._id,
        contentTitle: quiz.title,
        action: 'submitted',
        actor: req.user._id,
        actorRole: req.user.role,
        submittedBy: req.user._id,
      });

      res.json({ success: true, message: 'Submitted for review', quiz });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Delete a quiz
// @route  DELETE /api/quizzes/:id
// @access Teacher/Admin
router.delete(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

      if (
        req.user.role !== 'admin' &&
        String(quiz.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your quiz' });
      }

      await quiz.deleteOne();
      res.json({ success: true, message: 'Quiz deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Submit a quiz attempt
// @route  POST /api/quizzes/:id/submit
// @access Private (student)
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeTakenSeconds } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Only approved quizzes can be attempted
    if (quiz.status !== 'approved') {
      return res.status(403).json({ error: 'Quiz not available for attempts' });
    }

    const priorAttempts = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      student: req.user._id,
    });
    if (priorAttempts >= quiz.attemptsAllowed) {
      return res.status(400).json({
        error: `You've reached the max of ${quiz.attemptsAllowed} attempts`,
      });
    }

    let score = 0;
    const graded = quiz.questions.map((q) => {
      const ans = (answers || []).find(
        (a) => String(a.questionId) === String(q._id)
      );
      const selected = ans ? ans.selectedAnswer : null;
      const isCorrect = selected === q.correctAnswer;
      const awarded = isCorrect ? q.marks : 0;
      score += awarded;
      return {
        questionId: q._id,
        selectedAnswer: selected,
        isCorrect,
        marksAwarded: awarded,
      };
    });

    const percentage = Math.round((score / quiz.totalMarks) * 100);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      answers: graded,
      score,
      totalMarks: quiz.totalMarks,
      percentage,
      passed: percentage >= quiz.passingMarks,
      timeTakenSeconds: timeTakenSeconds || 0,
    });

    res.json({
      success: true,
      score,
      totalMarks: quiz.totalMarks,
      percentage,
      passed: attempt.passed,
      attemptId: attempt._id,
      answers: quiz.showAnswersImmediately ? graded : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Get my attempts for a quiz
// @route  GET /api/quizzes/:id/attempts
// @access Private
router.get('/:id/attempts', protect, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      quiz: req.params.id,
      student: req.user._id,
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: attempts.length, attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;