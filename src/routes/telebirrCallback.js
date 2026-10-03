// backend/routes/telebirrCallback.js
// Express router — receives Telebirr payment notifications

const express = require('express');
const router = express.Router();

// ─────────────────────────────────────────────────────────────
// POST /api/payments/telebirr/callback
// Telebirr sends a server-to-server notification here
// ─────────────────────────────────────────────────────────────
router.post('/callback', async (req, res) => {
  const payload = req.body || {};

  console.log('[Telebirr Callback] Received:');
  console.log(JSON.stringify(payload, null, 2));

  try {
    // STEP 1 — Detect callback type
    if (payload.ussd) {
      console.log('[Callback] Legacy encrypted payload detected');
      // TODO: Decrypt payload.ussd with your PRIVATE KEY
    } else if (payload.signature) {
      console.log('[Callback] Modern signed payload detected');
      // TODO: Verify with RSA-PSS + Telebirr PUBLIC KEY
    }

    // STEP 2 — Check payment status
    const status =
      payload.trade_status ||
      payload.data?.trade_status ||
      payload.status;

    if (status !== 'Completed' && status !== 'PAY_SUCCESS') {
      console.log('[Callback] Not a success:', status);
      return res.status(200).json({ code: 0, msg: 'ok' });
    }

    // STEP 3 — Fulfill the order
    const orderId =
      payload.out_trade_no ||
      payload.data?.out_trade_no ||
      payload.merch_order_id;

    // TODO: Update your database here
    // const Enrollment = require('../models/Enrollment');
    // await Enrollment.findOneAndUpdate(
    //   { orderId },
    //   { status: 'paid', paidAt: new Date() }
    // );

    console.log('[Callback] ✅ Order fulfilled:', orderId);

    return res.status(200).json({ code: 0, msg: 'ok', orderId });
  } catch (error) {
    console.error('[Callback] Error:', error);
    // Always return 200 so Telebirr doesn't retry-storm you
    return res.status(200).json({ code: 0, msg: 'ok' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/telebirr/initiate
// Alternative route for starting payments
// ─────────────────────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  const { courseId, amount, title } = req.body;

  if (!courseId || !amount) {
    return res.status(400).json({ error: 'courseId and amount required' });
  }

  const merchOrderId = `QT-${Date.now()}`;

  res.json({
    success: true,
    merchOrderId,
    checkoutUrl: `https://checkout.telebirr.et/pay/${merchOrderId}`,
  });
});

module.exports = router;