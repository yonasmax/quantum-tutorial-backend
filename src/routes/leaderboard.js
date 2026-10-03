const express = require('express');
const router = express.Router();
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ================================================================
// GET /api/leaderboard
// Query: ?grade=9&limit=10
// Returns: Top students ranked by average exam percentage
// ================================================================
router.get('/', protect, async (req, res) => {
  try {
    const { grade, limit = 10 } = req.query;

    // Build match filter
    const matchFilter = {
      status: { $in: ['submitted', 'graded'] },
      percentage: { $exists: true, $ne: null },
    };

    // Aggregate: group by student, compute average
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: '$student',
          avgPercentage: { $avg: '$percentage' },
          examsTaken: { $sum: 1 },
          totalMarksEarned: { $sum: '$score' },
          totalMarksPossible: { $sum: '$totalMarks' },
          bestPercentage: { $max: '$percentage' },
        },
      },
      { $sort: { avgPercentage: -1, examsTaken: -1 } },
      { $limit: parseInt(limit, 10) * 3 }, // fetch extra to filter by grade
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $match: {
          'student.role': 'student',
          'student.status': 'active',
        },
      },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          fullName: '$student.fullName',
          grade: '$student.grade',
          avgPercentage: { $round: ['$avgPercentage', 1] },
          bestPercentage: { $round: ['$bestPercentage', 1] },
          examsTaken: 1,
          totalMarksEarned: 1,
          totalMarksPossible: 1,
        },
      },
    ];

    // Optional grade filter
    if (grade) {
      pipeline.push({ $match: { grade: String(grade) } });
    }

    // Final limit
    pipeline.push({ $limit: parseInt(limit, 10) });

    const raw = await ExamAttempt.aggregate(pipeline);

    // Add rank + medal
    const leaderboard = raw.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      medal:
        idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null,
    }));

    // Find current user's rank (if student)
    let myRank = null;
    if (req.user.role === 'student') {
      const myIdx = leaderboard.findIndex(
        (e) => String(e.studentId) === String(req.user._id)
      );
      if (myIdx >= 0) {
        myRank = leaderboard[myIdx];
      }
    }

    // ⭐ Cache for 30 minutes at edge — rankings change slowly
    res.setHeader(
      'Cache-Control',
      'private, s-maxage=1800, stale-while-revalidate=86400'
    );

    res.json({
      success: true,
      count: leaderboard.length,
      filter: { grade: grade || 'all' },
      leaderboard,
      myRank,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;