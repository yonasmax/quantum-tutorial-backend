const User = require('../models/User');
const Exam = require('../models/Exam');
const Lesson = require('../models/Lesson');
const { scheduleReminder } = require('./reminderService');

// ================================================================
// SCAN FOR UPCOMING EXAM REMINDERS (students)
// ================================================================
const scanExamReminders = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Exams starting in the next 24 hours
  const upcomingExams = await Exam.find({
    status: 'approved',
    isActive: true,
    startDate: { $gte: now, $lte: in24h },
  });

  let scheduled = 0;

  for (const exam of upcomingExams) {
    // Find students in this grade
    const students = await User.find({
      role: 'student',
      status: 'active',
      grade: String(exam.grade),
    });

    for (const student of students) {
      // Reminder: 24 hours before
      const scheduledFor24h = new Date(
        exam.startDate.getTime() - 24 * 60 * 60 * 1000
      );
      if (scheduledFor24h > now) {
        await scheduleReminder({
          recipient: student,
          type: 'exam-upcoming',
          subject: `📅 Exam Reminder: ${exam.title} starts tomorrow`,
          title: 'Upcoming Exam Tomorrow',
          body: `
            <p>Hi <strong>${student.fullName}</strong>,</p>
            <p>Your <strong>${exam.subject} — Grade ${exam.grade}</strong> exam is scheduled for tomorrow.</p>
            <p><strong>Exam:</strong> ${exam.title}</p>
            <p><strong>Starts:</strong> ${exam.startDate.toLocaleString('en-GB')}</p>
            <p>Make sure to review your lessons and get a good night's sleep!</p>
          `,
          scheduledFor: scheduledFor24h,
          relatedId: exam._id,
          relatedModel: 'Exam',
        });
        scheduled++;
      }
    }
  }

  // Exams ending in the next 24 hours (final chance)
  const endingSoon = await Exam.find({
    status: 'approved',
    isActive: true,
    endDate: { $gte: now, $lte: in24h },
  });

  for (const exam of endingSoon) {
    const students = await User.find({
      role: 'student',
      status: 'active',
      grade: String(exam.grade),
    });

    for (const student of students) {
      const scheduledFor = new Date(
        exam.endDate.getTime() - 6 * 60 * 60 * 1000
      );
      if (scheduledFor > now) {
        await scheduleReminder({
          recipient: student,
          type: 'exam-deadline',
          subject: `⏰ Last chance: ${exam.title} ends soon`,
          title: 'Exam Deadline Approaching',
          body: `
            <p>Hi <strong>${student.fullName}</strong>,</p>
            <p>The <strong>${exam.title}</strong> exam closes in about 6 hours.</p>
            <p><strong>Deadline:</strong> ${exam.endDate.toLocaleString('en-GB')}</p>
            <p>Don't miss your chance to take it!</p>
          `,
          scheduledFor,
          relatedId: exam._id,
          relatedModel: 'Exam',
        });
        scheduled++;
      }
    }
  }

  return { scheduled };
};

// ================================================================
// SCAN FOR TEACHER LESSON-REVIEW REMINDERS
// ================================================================
const scanTeacherReviewReminders = async () => {
  const now = new Date();

  // Teachers with pendingReview or draft lessons
  const teachers = await User.find({
    role: 'teacher',
    status: 'active',
  });

  let scheduled = 0;

  for (const teacher of teachers) {
    const drafts = await Lesson.countDocuments({
      createdBy: teacher._id,
      status: { $in: ['draft', 'pendingReview'] },
    });

    if (drafts > 0) {
      // Schedule reminder for tomorrow at 8 AM
      const tomorrow8am = new Date(now);
      tomorrow8am.setDate(tomorrow8am.getDate() + 1);
      tomorrow8am.setHours(8, 0, 0, 0);

      await scheduleReminder({
        recipient: teacher,
        type: 'lesson-review',
        subject: `📝 You have ${drafts} lesson(s) waiting`,
        title: 'Pending Lessons Reminder',
        body: `
          <p>Hi <strong>${teacher.fullName}</strong>,</p>
          <p>You have <strong>${drafts} lesson(s)</strong> in draft or pending review.</p>
          <p>Please finish them so students can access your content.</p>
        `,
        scheduledFor: tomorrow8am,
      });
      scheduled++;
    }
  }

  return { scheduled };
};

// ================================================================
// SCAN FOR RE-ENGAGEMENT (users who haven't logged in)
// ================================================================
const scanReEngagement = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const inactiveUsers = await User.find({
    role: 'student',
    status: 'active',
    'reminderPreferences.reEngagement': true,
    $or: [
      { 'reminderPreferences.lastLoginAt': { $lte: sevenDaysAgo } },
      { 'reminderPreferences.lastLoginAt': null },
    ],
  }).limit(100);

  let scheduled = 0;

  for (const user of inactiveUsers) {
    const tomorrow9am = new Date(now);
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);

    await scheduleReminder({
      recipient: user,
      type: 're-engagement',
      subject: '📚 We miss you at Quantum!',
      title: 'Come Back and Learn',
      body: `
        <p>Hi <strong>${user.fullName}</strong>,</p>
        <p>It's been a while! New lessons and exams are waiting for you.</p>
        <p>Keep your learning streak going — jump back in today.</p>
      `,
      scheduledFor: tomorrow9am,
    });
    scheduled++;
  }

  return { scheduled };
};

module.exports = {
  scanExamReminders,
  scanTeacherReviewReminders,
  scanReEngagement,
};