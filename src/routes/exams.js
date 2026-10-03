const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const ReviewLog = require('../models/ReviewLog');
const { protect, authorize } = require('../middleware/auth');
const {
  sendEntranceExamPassed,
  sendExamResult,
  sendTestEmail,
} = require('../services/emailService');

// ================================================================
// HELPER — Strip correctAnswer + explanation from questions
// Used when returning exams to students BEFORE they submit
// ================================================================
const sanitizeExamForStudent = (exam) => {
  if (!exam) return exam;
  const examObj = exam.toObject ? exam.toObject() : { ...exam };
  if (Array.isArray(examObj.questions)) {
    examObj.questions = examObj.questions.map((q) => {
      const { correctAnswer, explanation, ...safe } = q;
      return safe;
    });
  }
  return examObj;
};

// ================================================================
// HELPER — check if user has passed a prerequisite exam type
// ================================================================
const hasPassedPrerequisite = async (userId, examType, minScore = 50, grade) => {
  const prereqExams = await Exam.find({
    examType,
    status: 'approved',
    isActive: true,
    ...(grade ? { grade } : {}),
  }).select('_id');

  if (prereqExams.length === 0) {
    return { passed: false, reason: 'No prerequisite exams available yet' };
  }

  const examIds = prereqExams.map((e) => e._id);

  const attempts = await ExamAttempt.find({
    student: userId,
    exam: { $in: examIds },
    status: { $in: ['submitted', 'graded'] },
  });

  if (attempts.length === 0) {
    return { passed: false, reason: 'You have not attempted the prerequisite exam yet' };
  }

  const passedAttempt = attempts.find((a) => a.percentage >= minScore);

  if (passedAttempt) {
    return {
      passed: true,
      score: passedAttempt.percentage,
      attemptId: passedAttempt._id,
    };
  }

  const bestScore = Math.max(...attempts.map((a) => a.percentage || 0));
  return {
    passed: false,
    reason: `Your best score is ${bestScore}%. Need ${minScore}% to unlock.`,
    score: bestScore,
  };
};

// ================================================================
// GET /api/exams/available-for-me
// ================================================================
router.get('/available-for-me', protect, async (req, res) => {
  try {
    const userGrade = req.user.grade;

    const filter = {
      status: 'approved',
      isActive: true,
    };

    if (req.user.role === 'student' && userGrade) {
      filter.grade = userGrade;
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ examType: 1, createdAt: -1 });

    const now = new Date();
    const enhanced = await Promise.all(
      exams.map(async (exam) => {
        // ⭐ Strip correct answers BEFORE adding attempt info
        const examObj = sanitizeExamForStudent(exam);

        const isWithinWindow =
          (!exam.startDate || exam.startDate <= now) &&
          (!exam.endDate || exam.endDate >= now);

        let isLocked = false;
        let lockReason = '';
        let prerequisiteInfo = null;

        if (exam.prerequisiteExamType) {
          const prereqResult = await hasPassedPrerequisite(
            req.user._id,
            exam.prerequisiteExamType,
            exam.prerequisitePassingScore || 50,
            userGrade
          );
          prerequisiteInfo = prereqResult;

          if (!prereqResult.passed) {
            isLocked = true;
            lockReason =
              prereqResult.reason ||
              `Complete ${exam.prerequisiteExamType} exam first (need ${exam.prerequisitePassingScore || 50}%)`;
          }
        }

        const existingAttempt = await ExamAttempt.findOne({
          exam: exam._id,
          student: req.user._id,
          status: { $in: ['submitted', 'graded'] },
        }).sort({ createdAt: -1 });

        return {
          ...examObj,
          isLocked,
          lockReason,
          prerequisiteInfo,
          isWithinWindow,
          attempted: !!existingAttempt,
          result: existingAttempt
            ? {
                obtainedMarks: existingAttempt.score,
                totalMarks: existingAttempt.totalMarks,
                percentage: existingAttempt.percentage,
                isPassed: existingAttempt.passed,
                submittedAt: existingAttempt.submittedAt,
              }
            : null,
        };
      })
    );

    const typeOrder = { entrance: 0, model: 1, regular: 2 };
    enhanced.sort((a, b) => {
      if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1;
      return (typeOrder[a.examType] || 2) - (typeOrder[b.examType] || 2);
    });

    res.json({ success: true, count: enhanced.length, exams: enhanced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/exams/:id/check-prerequisite
// ================================================================
router.post('/:id/check-prerequisite', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'admin') {
      return res.json({ success: true, canTake: true, isAdmin: true });
    }

    if (!exam.prerequisiteExamType) {
      return res.json({ success: true, canTake: true });
    }

    const result = await hasPassedPrerequisite(
      req.user._id,
      exam.prerequisiteExamType,
      exam.prerequisitePassingScore || 50,
      req.user.grade
    );

    res.json({
      success: true,
      canTake: result.passed,
      reason: result.reason || '',
      score: result.score,
      needed: exam.prerequisitePassingScore || 50,
      prerequisiteType: exam.prerequisiteExamType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/exams/available  (legacy)
// ================================================================
router.get('/available', protect, async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      status: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (req.user.role === 'student' && req.user.grade) {
      filter.grade = req.user.grade;
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });

    const enhanced = await Promise.all(
      exams.map(async (exam) => {
        // ⭐ Strip correct answers
        const examObj = sanitizeExamForStudent(exam);
        const attempt = await ExamAttempt.findOne({
          exam: exam._id,
          student: req.user._id,
        }).sort({ createdAt: -1 });

        return {
          ...examObj,
          attempted: !!attempt,
          result: attempt
            ? {
                obtainedMarks: attempt.score,
                totalMarks: attempt.totalMarks,
                percentage: attempt.percentage,
                isPassed: attempt.passed,
              }
            : null,
        };
      })
    );

    res.json({ success: true, count: enhanced.length, exams: enhanced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/exams/:id
// ================================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('course', 'title');

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // ⭐ Students can only see approved exams
    if (req.user.role === 'student' && exam.status !== 'approved') {
      return res.status(403).json({ error: 'Exam not available' });
    }

    // ⭐ Students can only see exams for their grade
    if (
      req.user.role === 'student' &&
      exam.grade &&
      req.user.grade &&
      String(exam.grade) !== String(req.user.grade)
    ) {
      return res.status(403).json({ error: 'Exam not available for your grade' });
    }

    // ⭐ Prerequisite check
    if (exam.prerequisiteExamType && req.user.role === 'student') {
      const result = await hasPassedPrerequisite(
        req.user._id,
        exam.prerequisiteExamType,
        exam.prerequisitePassingScore || 50,
        req.user.grade
      );
      if (!result.passed) {
        return res.status(403).json({
          error: result.reason || 'You have not unlocked this exam yet',
          isLocked: true,
        });
      }
    }

    // ⭐ Check if student already submitted — if yes, show answers; if no, strip them
    let responseExam;
    if (req.user.role === 'student') {
      const existingAttempt = await ExamAttempt.findOne({
        exam: exam._id,
        student: req.user._id,
        status: { $in: ['submitted', 'graded'] },
      });

      if (existingAttempt) {
        // Student already submitted — safe to show answers
        responseExam = exam.toObject();
      } else {
        // Student has NOT submitted — strip correctAnswer and explanation
        responseExam = sanitizeExamForStudent(exam);
      }
    } else {
      // Teacher/admin — show everything
      responseExam = exam.toObject();
    }

    res.json({ success: true, exam: responseExam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/exams  (create — teacher/admin)
// ================================================================
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const {
      title,
      subject,
      grade,
      questions,
      totalMarks,
      examType,
      prerequisiteExamType,
      prerequisitePassingScore,
      ...rest
    } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Add at least one question' });
    }

    const computedTotal =
      totalMarks || questions.reduce((s, q) => s + (q.marks || 1), 0);

    const exam = await Exam.create({
      title,
      subject,
      grade,
      questions,
      totalMarks: computedTotal,
      examType: examType || 'regular',
      prerequisiteExamType: prerequisiteExamType || null,
      prerequisitePassingScore: prerequisitePassingScore || 50,
      ...rest,
      createdBy: req.user._id,
      status: 'draft',
    });

    res.status(201).json({ success: true, exam });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================================================================
// PUT /api/exams/:id  (update — teacher/admin)
// ================================================================
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (
      req.user.role !== 'admin' &&
      String(exam.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ error: 'Not your exam' });
    }

    if (
      req.user.role !== 'admin' &&
      !['draft', 'rejected'].includes(exam.status)
    ) {
      return res.status(400).json({
        error: `Cannot edit exam in status "${exam.status}"`,
      });
    }

    Object.assign(exam, req.body);
    if (exam.status === 'rejected') exam.status = 'draft';
    await exam.save();

    res.json({ success: true, exam });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================================================================
// POST /api/exams/:id/submit-for-review
// ================================================================
router.post(
  '/:id/submit-for-review',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);
      if (!exam) return res.status(404).json({ error: 'Exam not found' });

      if (
        req.user.role !== 'admin' &&
        String(exam.createdBy) !== String(req.user._id)
      ) {
        return res.status(403).json({ error: 'Not your exam' });
      }

      if (!['draft', 'rejected'].includes(exam.status)) {
        return res.status(400).json({
          error: `Cannot submit from status "${exam.status}"`,
        });
      }

      exam.status = 'pendingReview';
      exam.submittedBy = req.user._id;
      exam.submittedAt = new Date();
      exam.reviewReason = '';
      await exam.save();

      await ReviewLog.create({
        contentType: 'exam',
        contentId: exam._id,
        contentTitle: exam.title,
        action: 'submitted',
        actor: req.user._id,
        actorRole: req.user.role,
        submittedBy: req.user._id,
      });

      res.json({ success: true, message: 'Submitted for review', exam });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ================================================================
// DELETE /api/exams/:id
// ================================================================
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (
      req.user.role !== 'admin' &&
      String(exam.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ error: 'Not your exam' });
    }

    await exam.deleteOne();
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// POST /api/exams/:id/submit  (student submits exam answers)
// ================================================================
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (exam.status !== 'approved') {
      return res.status(403).json({ error: 'Exam not available' });
    }

    if (exam.prerequisiteExamType && req.user.role === 'student') {
      const result = await hasPassedPrerequisite(
        req.user._id,
        exam.prerequisiteExamType,
        exam.prerequisitePassingScore || 50,
        req.user.grade
      );
      if (!result.passed) {
        return res.status(403).json({
          error: result.reason || 'You have not unlocked this exam',
        });
      }
    }

    const existingAttempt = await ExamAttempt.findOne({
      exam: exam._id,
      student: req.user._id,
      status: { $in: ['submitted', 'graded'] },
    });
    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this exam' });
    }

    // Grade
    let score = 0;
    const graded = exam.questions.map((q, idx) => {
      const selected =
        Array.isArray(answers) && answers[idx] !== undefined ? answers[idx] : -1;
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

    const percentage = Math.round((score / exam.totalMarks) * 100);
    const passed = percentage >= exam.passingMarks;

    const attempt = await ExamAttempt.create({
      exam: exam._id,
      student: req.user._id,
      answers: graded,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      passed,
      startedAt: new Date(Date.now() - (timeTaken || 0) * 1000),
      submittedAt: new Date(),
      timeTakenSeconds: timeTaken || 0,
      status: 'graded',
    });

    // Send email notification (non-blocking)
    try {
      if (passed && exam.examType === 'entrance') {
        await sendEntranceExamPassed(req.user, exam, percentage);
      } else {
        await sendExamResult(req.user, exam, {
          obtainedMarks: score,
          totalMarks: exam.totalMarks,
          percentage,
        });
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr.message);
    }

    res.json({
      success: true,
      data: {
        obtainedMarks: score,
        totalMarks: exam.totalMarks,
        percentage,
        isPassed: passed,
      },
      attemptId: attempt._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/exams/results/my
// ================================================================
router.get('/results/my', protect, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({
      student: req.user._id,
      status: { $in: ['submitted', 'graded'] },
    })
      .populate('exam', 'title subject grade totalMarks')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: attempts.length, results: attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// TEST — Send test email
// POST /api/exams/test-email
// ================================================================
router.post('/test-email', protect, async (req, res) => {
  try {
    const result = await sendTestEmail(req.user.email);
    if (result.success) {
      res.json({ success: true, message: `Test email sent to ${req.user.email}` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;