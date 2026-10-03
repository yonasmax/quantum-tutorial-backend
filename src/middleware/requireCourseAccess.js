const SubjectAssignment = require('../models/SubjectAssignment');
const Course = require('../models/Course');

/**
 * Middleware: requireCourseAccess
 *
 * Ensures the current user has access to the given course:
 *  - Admin: always allowed
 *  - Teacher: only if assigned to the course's (subject, grade)
 *  - Student: only if their grade matches the course's grade
 *
 * Attaches req.courseDoc = the course document.
 */
const requireCourseAccess = async (req, res, next) => {
  try {
    const courseId =
      req.params?.courseId ||
      req.params?.id ||
      req.body?.course ||
      req.query?.course;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const courseDoc = await Course.findById(courseId).select(
      'subject grade isPublished title'
    );
    if (!courseDoc) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Admin: always allowed
    if (req.user?.role === 'admin') {
      req.courseDoc = courseDoc;
      return next();
    }

    // Teacher: must be assigned
    if (req.user?.role === 'teacher') {
      const assignment = await SubjectAssignment.findOne({
        teacher: req.user._id,
        subject: courseDoc.subject,
        grade: courseDoc.grade,
        isActive: true,
      });
      if (!assignment) {
        return res.status(403).json({
          error: `You are not assigned to ${courseDoc.subject} — Grade ${courseDoc.grade}.`,
          code: 'NOT_ASSIGNED',
        });
      }
      req.assignment = assignment;
      req.courseDoc = courseDoc;
      return next();
    }

    // Student: grade must match
    if (req.user?.role === 'student') {
      if (courseDoc.grade !== req.user.grade) {
        return res.status(403).json({
          error: 'This course is not available for your grade level.',
          code: 'GRADE_MISMATCH',
        });
      }
      req.courseDoc = courseDoc;
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = requireCourseAccess;