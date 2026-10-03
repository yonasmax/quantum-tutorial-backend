const mongoose = require('mongoose');

/**
 * SubjectAssignment
 * Links a teacher to a specific (subject + grade).
 * Only assigned teachers can create content for that subject+grade.
 * Admin creates assignments via /api/assignments
 */
const SubjectAssignmentSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: [
        'Mathematics',
        'Environmental Science',
        'General Science',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Social Studies',
        'Geography',
        'History',
        'Geez',
      ],
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// One teacher can be assigned once per (subject, grade)
SubjectAssignmentSchema.index(
  { subject: 1, grade: 1, teacher: 1 },
  { unique: true }
);

// Fast lookup by (subject, grade) — used by requireAssignment middleware
SubjectAssignmentSchema.index({ subject: 1, grade: 1, isActive: 1 });

module.exports = mongoose.model('SubjectAssignment', SubjectAssignmentSchema);