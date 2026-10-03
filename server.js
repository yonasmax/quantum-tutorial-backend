// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// --- Import Routes ---
const telebirrCallbackRoutes = require('./src/routes/telebirrCallback');
const authRoutes = require('./src/routes/auth');
const courseRoutes = require('./src/routes/courses');   // ⭐ NEW

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Connection (MongoDB Atlas) ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Telebirr C2B Client ---
let c2bClient = null;
try {
  const { C2B } = require('telebirr-nodejs');
  c2bClient = new C2B({
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    appId: process.env.TELEBIRR_FABRIC_APP_ID,
    appSecret: process.env.TELEBIRR_APP_SECRET,
    merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID,
    merchantCode: process.env.TELEBIRR_MERCHANT_CODE,
    privateKey: process.env.TELEBIRR_PRIVATE_KEY_PEM,
    notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
    redirectUrl: process.env.TELEBIRR_REDIRECT_URL,
  });
  console.log('✅ Telebirr C2B client initialized');
} catch (error) {
  console.warn(
    '⚠️  Telebirr client not initialized (missing env vars or package):',
    error.message
  );
  console.warn('   Payment routes will return 503 until configured.');
}

// --- Global Middleware ---
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Safe JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[Bad JSON] Malformed request body:', err.message);
    return res.status(400).json({
      error: 'Invalid JSON body',
      hint: 'Check that Content-Type is application/json and body is valid JSON',
    });
  }
  next(err);
});

// --- CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'https://quantum-tutorial.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// --- Routes ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Course routes
app.use('/api/courses', courseRoutes);   // ⭐ NEW

// Telebirr callback handler
app.use('/api/payments/telebirr', telebirrCallbackRoutes);

// Initiate Telebirr payment
app.post('/api/payments/initiate', async (req, res) => {
  if (!c2bClient) {
    return res
      .status(503)
      .json({ error: 'Telebirr not configured on this server' });
  }

  const { courseId, title, amount } = req.body;
  const userId = req.user?._id || 'test-user-id';

  if (!courseId || !title || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const merchOrderId = `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const checkoutUrl = await c2bClient.checkout({
      merchOrderId,
      title,
      amount: amount.toString(),
      callbackInfo: JSON.stringify({ userId, courseId }),
    });
    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Telebirr checkout error:', error.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Query payment status
app.get('/api/payments/status/:merchOrderId', async (req, res) => {
  if (!c2bClient) {
    return res.status(503).json({ error: 'Telebirr not configured' });
  }
  try {
    const info = await c2bClient.queryOrder(req.params.merchOrderId);
    res.json(info);
  } catch (error) {
    console.error('Telebirr query error:', error.message);
    res.status(500).json({ error: 'Failed to query payment status' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Listening on http://0.0.0.0:${PORT} (all IPv4 interfaces)`);
});