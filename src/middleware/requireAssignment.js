const SubjectAssignment = require('../models/SubjectAssignment');
const Course = require('../models/Course');

/**
 * Middleware: requireAssignment
 *
 * Verifies the logged-in teacher is assigned to the (subject, grade)
 * of the course they are trying to act on.
 *
 * Accepts subject+grade directly (req.body) OR a course ID
 * (req.body.course / req.params.id) to look up.
 *
 * Admins bypass this check.
 */
const requireAssignment = async (req, res, next) => {
  try {
    // Admin bypass
    if (req.user?.role === 'admin') {
      return next();
    }

    if (req.user?.role !== 'teacher') {
      return res.status(403).json({
        error: 'Only teachers or admins can perform this action',
      });
    }

    let subject = req.body?.subject || req.query?.subject;
    let grade = req.body?.grade || req.query?.grade;

    // If not sent directly, look up from the course
    const courseId =
      req.body?.course ||
      req.query?.course ||
      req.params?.courseId ||
      req.params?.id;

    if ((!subject || !grade) && courseId) {
      const courseDoc = await Course.findById(courseId).select('subject grade');
      if (!courseDoc) {
        return res.status(404).json({ error: 'Course not found' });
      }
      subject = courseDoc.subject;
      grade = courseDoc.grade;
    }

    if (!subject || !grade) {
      return res.status(400).json({
        error: 'subject and grade are required to verify your assignment',
      });
    }

    const assignment = await SubjectAssignment.findOne({
      teacher: req.user._id,
      subject,
      grade,
      isActive: true,
    });

    if (!assignment) {
      return res.status(403).json({
        error: `You are not assigned to ${subject} — Grade ${grade}. Contact admin.`,
        code: 'NOT_ASSIGNED',
        subject,
        grade,
      });
    }

    req.assignment = assignment;
    req.courseScope = { subject, grade };
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = requireAssignment;