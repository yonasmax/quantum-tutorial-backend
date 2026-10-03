// backend/src/routes/telebirr.js
// ═══════════════════════════════════════════════════════════════
// Telebirr Routes — config check, initiate payment, webhook
// Mounted at /api/telebirr in app.js
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();

// Try to load the utility that exists in your project
let telebirrUtil = null;
try {
  telebirrUtil = require('../utils/telebirr');
} catch (e) {
  telebirrUtil = null;
}

// Try the alternate filename
let telebirrService = null;
try {
  telebirrService = require('../utils/telebirrservice');
} catch (e) {
  telebirrService = null;
}

// ─── HEALTH / CONFIG ──────────────────────────────────────────
// GET /api/telebirr/config
router.get('/config', (req, res) => {
  const hasAppId = !!process.env.TELEBIRR_APP_ID;
  const hasAppKey = !!process.env.TELEBIRR_APP_KEY;
  const hasShortCode = !!process.env.TELEBIRR_SHORT_CODE;
  const hasPrivateKey = !!process.env.TELEBIRR_PRIVATE_KEY;

  res.json({
    success: true,
    configured: hasAppId && hasAppKey && hasShortCode && hasPrivateKey,
    fields: {
      appId: hasAppId,
      appKey: hasAppKey,
      shortCode: hasShortCode,
      privateKey: hasPrivateKey,
      notifyUrl: process.env.TELEBIRR_NOTIFY_URL || null,
      returnUrl: process.env.TELEBIRR_RETURN_URL || null,
    },
    environment: process.env.TELEBIRR_ENV || 'sandbox',
    message: (hasAppId && hasAppKey && hasShortCode && hasPrivateKey)
      ? 'Telebirr is configured and ready.'
      : 'Telebirr credentials are missing. Set TELEBIRR_APP_ID, TELEBIRR_APP_KEY, TELEBIRR_SHORT_CODE, TELEBIRR_PRIVATE_KEY in Railway env vars.',
  });
});

// ─── INITIATE PAYMENT ─────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  try {
    const { amount, orderId, subject, returnUrl } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, error: 'amount and orderId are required' });
    }

    const svc = telebirrService || telebirrUtil;
    if (!svc) {
      return res.status(500).json({
        success: false,
        error: 'Telebirr utility not found. Expected backend/src/utils/telebirr.js or telebirrservice.js',
      });
    }

    const fn =
      svc.createOrder ||
      svc.initiatePayment ||
      svc.generatePaymentUrl ||
      (svc.default && (svc.default.createOrder || svc.default.initiatePayment));

    if (typeof fn !== 'function') {
      return res.status(500).json({
        success: false,
        error: 'Telebirr utility does not export createOrder / initiatePayment / generatePaymentUrl',
      });
    }

    const result = await fn({
      amount,
      orderId,
      subject: subject || 'Quantum Tutorial Subscription',
      returnUrl: returnUrl || process.env.TELEBIRR_RETURN_URL,
    });

    return res.json({
      success: true,
      paymentUrl: result?.paymentUrl || result?.toPayUrl || result?.url,
      raw: result,
    });
  } catch (err) {
    console.error('[telebirr/initiate] error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── WEBHOOK ──────────────────────────────────────────────────
router.post('/notify', async (req, res) => {
  try {
    console.log('[telebirr/notify] Received webhook:', {
      body: req.body,
      time: new Date().toISOString(),
    });
    res.json({ code: 0, msg: 'success' });
  } catch (err) {
    console.error('[telebirr/notify] error:', err);
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ─── STATUS ───────────────────────────────────────────────────
router.get('/status/:orderId', async (req, res) => {
  try {
    res.json({
      success: true,
      orderId: req.params.orderId,
      status: 'pending',
      message: 'Status lookup not yet implemented',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TEST CONNECTION ──────────────────────────────────────────
router.get('/test-connection', async (req, res) => {
  try {
    const svc = telebirrService || telebirrUtil;
    if (!svc) {
      return res.status(500).json({
        success: false,
        error: 'Telebirr utility not found',
      });
    }

    const fn =
      svc.testConnection ||
      svc.getAuthToken ||
      svc.applyFabricToken;

    if (typeof fn !== 'function') {
      return res.status(500).json({
        success: false,
        error: 'Telebirr utility has no testConnection / getAuthToken',
        availableExports: Object.keys(svc),
      });
    }

    const result = await fn();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;