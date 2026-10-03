const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const ExamAttempt = require('../models/ExamAttempt');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');
const generateCertificate = require('../utils/generateCertificate');

// ================================================================
// GET /api/certificates/:attemptId/download
// Student/admin downloads their certificate PDF
// ================================================================
router.get('/:attemptId/download', protect, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.attemptId)
      .populate('exam', 'title subject grade totalMarks passingMarks')
      .populate('student', 'fullName email role');

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Access control: only the student, or admin
    const isOwner =
      String(attempt.student?._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Must have passed
    if (!attempt.passed) {
      return res
        .status(400)
        .json({ error: 'Certificate only available for passed exams' });
    }

    // Generate verification code if missing
    if (!attempt.certificateCode) {
      attempt.certificateCode = crypto
        .randomBytes(6)
        .toString('hex')
        .toUpperCase();
      attempt.certificateIssuedAt = new Date();
      await attempt.save();
    }

    // Build PDF
    const pdfBuffer = await generateCertificate({
      studentName: attempt.student.fullName,
      examTitle: attempt.exam.title,
      subject: attempt.exam.subject,
      grade: attempt.exam.grade,
      percentage: attempt.percentage,
      obtainedMarks: attempt.score,
      totalMarks: attempt.totalMarks,
      verificationCode: attempt.certificateCode,
      issuedAt: attempt.certificateIssuedAt,
    });

    const filename = `Certificate-${attempt.student.fullName.replace(
      /\s+/g,
      '_'
    )}-${attempt.certificateCode}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Certificate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/certificates/verify/:code
// PUBLIC — anyone can verify a certificate by code
// ================================================================
router.get('/verify/:code', async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();

    const attempt = await ExamAttempt.findOne({ certificateCode: code })
      .populate('exam', 'title subject grade')
      .populate('student', 'fullName grade');

    if (!attempt) {
      return res.status(404).json({
        valid: false,
        error: 'No certificate found with that code',
      });
    }

    res.json({
      valid: true,
      certificate: {
        studentName: attempt.student?.fullName || 'Unknown',
        grade: attempt.student?.grade || '—',
        examTitle: attempt.exam?.title || '—',
        subject: attempt.exam?.subject || '—',
        percentage: attempt.percentage,
        score: `${attempt.score}/${attempt.totalMarks}`,
        issuedAt: attempt.certificateIssuedAt,
        code: attempt.certificateCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================================================
// GET /api/certificates/my
// List all certificates earned by the current student
// ================================================================
router.get('/my', protect, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({
      student: req.user._id,
      passed: true,
      certificateCode: { $ne: null },
    })
      .populate('exam', 'title subject grade')
      .sort({ certificateIssuedAt: -1 });

    res.json({
      success: true,
      count: attempts.length,
      certificates: attempts.map((a) => ({
        attemptId: a._id,
        code: a.certificateCode,
        issuedAt: a.certificateIssuedAt,
        examTitle: a.exam?.title,
        subject: a.exam?.subject,
        grade: a.exam?.grade,
        percentage: a.percentage,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;