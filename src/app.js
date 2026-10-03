const express = require('express'); // touch-$(date)
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// ================================================================
// CORS — permissive, works with any frontend (Vercel, mobile, localhost)
// ================================================================
app.use(
  cors({
    origin: true,               // reflect request origin back
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle preflight requests explicitly for all routes
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================================================================
// SAFE REQUIRE HELPER
// Loads a route file. If it fails (syntax error, missing file, etc.),
// returns a stub router that returns 503 — the rest of the app keeps running.
// ================================================================
const safeRequire = (path, label) => {
  try {
    const mod = require(path);
    console.log(`✅ [routes] Loaded: ${path}`);
    return mod;
  } catch (err) {
    console.error(`❌ [routes] FAILED to load "${path}" (${label}):`, err.message);
    console.error(err.stack);
    // Return a stub router so the app boots anyway
    const stub = express.Router();
    stub.use((req, res) => {
      res.status(503).json({
        error: `Route module "${label}" is unavailable`,
        detail: err.message,
        hint: 'Check Railway logs for the exact error at startup.',
      });
    });
    return stub;
  }
};

// ================================================================
// ROUTE IMPORTS (using safeRequire — one bad file can't crash the app)
// ================================================================
const authRoutes          = safeRequire('./routes/auth', 'auth');
const courseRoutes        = safeRequire('./routes/courses', 'courses');
const lessonRoutes        = safeRequire('./routes/lessons', 'lessons');
const examRoutes          = safeRequire('./routes/exams', 'exams');
const quizRoutes          = safeRequire('./routes/quizzes', 'quizzes');
const activityRoutes      = safeRequire('./routes/activities', 'activities');
const assignmentRoutes    = safeRequire('./routes/assignments', 'assignments');
const paymentRoutes       = safeRequire('./routes/payments', 'payments');
const telebirrRoutes      = safeRequire('./routes/telebirr', 'telebirr');
const notificationRoutes  = safeRequire('./routes/notifications', 'notifications');
const libraryRoutes       = safeRequire('./routes/library', 'library');
const booksRoutes         = safeRequire('./routes/books', 'books');
const advertisingRoutes   = safeRequire('./routes/advertising', 'advertising');
const fundraisingRoutes   = safeRequire('./routes/fundraising', 'fundraising');
const investorRoutes      = safeRequire('./routes/investors', 'investors');
const counselingRoutes    = safeRequire('./routes/counseling', 'counseling');
const adminRoutes         = safeRequire('./routes/admin', 'admin');
const teacherAIRoutes     = safeRequire('./routes/teacherAI', 'teacherAI');
const reviewQueueRoutes   = safeRequire('./routes/reviewQueue', 'reviewQueue');
const geezRoutes          = safeRequire('./routes/geez', 'geez');
const philosophyRoutes    = safeRequire('./routes/philosophy', 'philosophy');
const supportRoutes       = safeRequire('./routes/support', 'support');
const leaderboardRoutes   = safeRequire('./routes/leaderboard', 'leaderboard');
const certificateRoutes   = safeRequire('./routes/certificates', 'certificates');
const cronRoutes          = safeRequire('./routes/cron', 'cron');
const reminderRoutes      = safeRequire('./routes/reminders', 'reminders');
const adRoutes            = safeRequire('./routes/ads', 'ads');
const analyticsRoutes     = safeRequire('./routes/analytics', 'analytics');
const chatRoutes          = safeRequire('./routes/chat', 'chat');
const growthRoutes        = safeRequire('./routes/growth', 'growth');
const schoolRoutes        = safeRequire('./routes/schools', 'schools');
const subscriptionRoutes  = safeRequire('./routes/subscriptions', 'subscriptions');

// ================================================================
// ROUTES
// ================================================================
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/telebirr', telebirrRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/fundraising', fundraisingRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher-ai', teacherAIRoutes);
app.use('/api/review-queue', reviewQueueRoutes);
app.use('/api/geez', geezRoutes);
app.use('/api/philosophy', philosophyRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/growth', growthRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// ================================================================
// HEALTH CHECK
// ================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quantum Tutorial API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ================================================================
// ROUTE DIAGNOSTIC — shows which route modules loaded successfully
// ================================================================
app.get('/api/diagnostic', (req, res) => {
  const modules = {
    auth: !!authRoutes, courses: !!courseRoutes, lessons: !!lessonRoutes,
    exams: !!examRoutes, quizzes: !!quizRoutes, activities: !!activityRoutes,
    assignments: !!assignmentRoutes, payments: !!paymentRoutes,
    telebirr: !!telebirrRoutes, notifications: !!notificationRoutes,
    library: !!libraryRoutes, books: !!booksRoutes, advertising: !!advertisingRoutes,
    fundraising: !!fundraisingRoutes, investors: !!investorRoutes,
    counseling: !!counselingRoutes, admin: !!adminRoutes, teacherAI: !!teacherAIRoutes,
    reviewQueue: !!reviewQueueRoutes, geez: !!geezRoutes, philosophy: !!philosophyRoutes,
    support: !!supportRoutes, leaderboard: !!leaderboardRoutes,
    certificates: !!certificateRoutes, cron: !!cronRoutes, reminders: !!reminderRoutes,
    ads: !!adRoutes, analytics: !!analyticsRoutes, chat: !!chatRoutes,
    growth: !!growthRoutes, schools: !!schoolRoutes, subscriptions: !!subscriptionRoutes,
  };
  res.json({
    status: 'diagnostic',
    message: 'Check Railway logs for ❌ [routes] FAILED lines to see what broke.',
    loadedModules: modules,
    brokenModules: Object.entries(modules).filter(([, v]) => !v).map(([k]) => k),
    timestamp: new Date().toISOString(),
  });
});

// ================================================================
// ROOT
// ================================================================
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Quantum Tutorial API',
    version: '1.0.0',
    status: 'Online',
  });
});

// ================================================================
// 404
// ================================================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ================================================================
// ERROR HANDLER
// ================================================================
app.use(errorHandler);

module.exports = app;
// Force deploy 09/26/2026 20:08:27