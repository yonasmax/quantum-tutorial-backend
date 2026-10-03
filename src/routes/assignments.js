const express = require('express');
const router = express.Router();
const SubjectAssignment = require('../models/SubjectAssignment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc   List all assignments (with teacher info)
// @route  GET /api/assignments
// @access Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject, grade, teacher, isActive } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (teacher) filter.teacher = teacher;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const assignments = await SubjectAssignment.find(filter)
      .populate('teacher', 'fullName email role')
      .populate('assignedBy', 'fullName email')
      .sort({ subject: 1, grade: 1, createdAt: -1 });

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Create an assignment
// @route  POST /api/assignments
// @access Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject, grade, teacher, notes } = req.body;

    if (!subject || !grade || !teacher) {
      return res.status(400).json({
        error: 'subject, grade and teacher are required',
      });
    }

    // Verify teacher exists and has role 'teacher'
    const teacherUser = await User.findById(teacher);
    if (!teacherUser) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    if (teacherUser.role !== 'teacher' && teacherUser.role !== 'admin') {
      return res.status(400).json({
        error: 'Selected user is not a teacher',
      });
    }

    // Duplicate check
    const existing = await SubjectAssignment.findOne({
      subject,
      grade,
      teacher,
    });
    if (existing) {
      return res.status(400).json({
        error: 'This teacher is already assigned to this subject + grade',
      });
    }

    const assignment = await SubjectAssignment.create({
      subject,
      grade,
      teacher,
      assignedBy: req.user._id,
      notes: notes || '',
    });

    await assignment.populate('teacher', 'fullName email role');

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc   Update an assignment (toggle active, change notes)
// @route  PUT /api/assignments/:id
// @access Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('teacher', 'fullName email role');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc   Delete (or deactivate) an assignment
// @route  DELETE /api/assignments/:id
// @access Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assignment = await SubjectAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Get MY assignments (for logged-in teacher)
// @route  GET /api/assignments/mine
// @access Teacher/Admin
router.get('/mine', protect, async (req, res) => {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { teacher: req.user._id, isActive: true };

    const assignments = await SubjectAssignment.find(filter)
      .populate('teacher', 'fullName email')
      .sort({ subject: 1, grade: 1 });

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;