// api/payments/telebirr/callback.js
// Vercel Serverless Function — receives Telebirr payment notifications

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  
  console.log('[Telebirr Callback] Received:', JSON.stringify(payload, null, 2));

  try {
    // STEP 1 — Detect callback type
    if (payload.ussd) {
      console.log('[Callback] Legacy encrypted payload detected');
      // TODO: Decrypt using your PRIVATE KEY
    } else if (payload.signature) {
      console.log('[Callback] Modern signed payload detected');
      // TODO: Verify with RSA-PSS + Telebirr PUBLIC KEY
    }

    // STEP 2 — Check payment status
    const status = payload.trade_status || payload.data?.trade_status;
    
    if (status !== 'Completed' && status !== 'PAY_SUCCESS') {
      console.log('[Callback] Not a success:', status);
      return res.status(200).json({ code: 0, msg: 'ok' });
    }

    // STEP 3 — Fulfill the order
    const orderId = payload.out_trade_no || payload.data?.out_trade_no;
    
    // TODO: Update YOUR database here
    // await Enrollment.findOneAndUpdate(
    //   { orderId },
    //   { status: 'paid', paidAt: new Date() }
    // );

    console.log('[Callback] ✅ Order fulfilled:', orderId);

    return res.status(200).json({ code: 0, msg: 'ok' });

  } catch (error) {
    console.error('[Callback] Error:', error);
    // Always return 200 so Telebirr doesn't retry-storm you
    return res.status(200).json({ code: 0, msg: 'ok' });
  }
}