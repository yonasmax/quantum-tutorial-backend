const crypto = require('crypto');
const https = require('https');
const axios = require('axios');

// ================================================================
// CONFIG
// ================================================================
const BASE_URL =
  process.env.TELEBIRR_BASE_URL ||
  'https://196.188.120.3:38443/apiaccess/payment/gateway';

const FABRIC_APP_ID = process.env.TELEBIRR_FABRIC_APP_ID;
const APP_SECRET = process.env.TELEBIRR_APP_SECRET;
const MERCHANT_APP_ID = process.env.TELEBIRR_MERCHANT_APP_ID;
const SHORT_CODE = process.env.TELEBIRR_SHORT_CODE;

// ================================================================
// PRIVATE KEY — handle Vercel's single-line format
// ================================================================
const PRIVATE_KEY = (process.env.TELEBIRR_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')
  .trim();

const NOTIFY_URL =
  process.env.TELEBIRR_NOTIFY_URL ||
  'https://quantum-api-server.vercel.app/api/payments/notify';

// ================================================================
// HTTPS AGENT — accepts Ethio's self-signed cert
// ================================================================
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

// ================================================================
// HELPER — axios wrapper that respects the httpsAgent
// ================================================================
const httpRequest = async (url, options) => {
  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined,
      httpsAgent,
      timeout: 30000, // 30s timeout so we fail fast on unreachable hosts
      validateStatus: () => true, // don't throw on 4xx/5xx
    });

    return {
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  } catch (err) {
    // This will catch network-level errors (DNS, TLS, TCP timeout)
    console.error('❌ httpRequest network error:', {
      url,
      code: err.code,
      message: err.message,
    });
    throw new Error(`Network error: ${err.code || err.message} → ${url}`);
  }
};

// ================================================================
// STEP 1 — APPLY FABRIC TOKEN
// ================================================================
const applyFabricToken = async () => {
  if (!FABRIC_APP_ID || !APP_SECRET) {
    throw new Error(
      'Telebirr credentials missing. Check TELEBIRR_FABRIC_APP_ID and TELEBIRR_APP_SECRET env vars.'
    );
  }

  console.log('➡️ Requesting fabric token from:', `${BASE_URL}/payment/v1/token`);

  const result = await httpRequest(`${BASE_URL}/payment/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': FABRIC_APP_ID,
    },
    body: JSON.stringify({ appSecret: APP_SECRET }),
  });

  console.log('🔑 applyFabricToken response:', result.status, result.data);

  if (!result.ok || !result.data?.token) {
    throw new Error(
      `Fabric token failed: ${JSON.stringify(result.data)}`
    );
  }

  return result.data.token;
};

// ================================================================
// STEP 2 — GET AUTH TOKEN
// ================================================================
const getAuthToken = async (fabricToken) => {
  if (!MERCHANT_APP_ID) {
    throw new Error('TELEBIRR_MERCHANT_APP_ID is missing');
  }
  if (!PRIVATE_KEY) {
    throw new Error(
      'TELEBIRR_PRIVATE_KEY is missing. Check your Vercel env vars.'
    );
  }

  const body = JSON.stringify({
    appSecret: APP_SECRET,
    merchantAppId: MERCHANT_APP_ID,
  });

  const result = await httpRequest(`${BASE_URL}/payment/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fabricToken}`,
      'X-APP-Key': FABRIC_APP_ID,
    },
    body,
  });

  console.log('🎫 getAuthToken response:', result.status, result.data);

  if (!result.ok || !result.data?.token) {
    throw new Error(`Auth token failed: ${JSON.stringify(result.data)}`);
  }

  return result.data.token;
};

// ================================================================
// STEP 3 — CREATE ORDER
// ================================================================
const createOrder = async ({
  authToken,
  orderId,
  amount,
  phone,
  title,
  notifyUrl,
}) => {
  if (!SHORT_CODE) {
    throw new Error('TELEBIRR_SHORT_CODE is missing');
  }

  const payload = {
    appid: MERCHANT_APP_ID,
    merch_code: SHORT_CODE,
    nonce_str: crypto.randomBytes(16).toString('hex'),
    out_trade_no: orderId,
    total_amount: String(amount),
    trade_type: 'Checkout',
    title: title || 'Quantum Tutorial Subscription',
    notify_url: notifyUrl || NOTIFY_URL,
    redirect_url: `${
      process.env.FRONTEND_URL || 'https://quantum-tutorial.vercel.app'
    }/payments`,
    buyer_phone: phone || '',
    timeout_express: '30m',
  };

  const result = await httpRequest(`${BASE_URL}/payment/v1/merchant/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      'X-APP-Key': FABRIC_APP_ID,
    },
    body: JSON.stringify(payload),
  });

  console.log('📦 createOrder response:', result.status, result.data);

  if (!result.ok) {
    throw new Error(`Create order failed: ${JSON.stringify(result.data)}`);
  }

  return result.data;
};

// ================================================================
// STEP 4 — QUERY ORDER STATUS
// ================================================================
const queryOrder = async ({ authToken, orderId }) => {
  const payload = {
    appid: MERCHANT_APP_ID,
    merch_code: SHORT_CODE,
    nonce_str: crypto.randomBytes(16).toString('hex'),
    out_trade_no: orderId,
  };

  const result = await httpRequest(
    `${BASE_URL}/payment/v1/merchant/order/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        'X-APP-Key': FABRIC_APP_ID,
      },
      body: JSON.stringify(payload),
    }
  );

  console.log('🔍 queryOrder response:', result.status, result.data);

  return result.data;
};

// ================================================================
// PUBLIC — start a payment
// ================================================================
const initiatePayment = async ({ orderId, amount, phone, title }) => {
  const fabricToken = await applyFabricToken();
  const authToken = await getAuthToken(fabricToken);
  const orderResponse = await createOrder({
    authToken,
    orderId,
    amount,
    phone,
    title,
  });

  const prepayId =
    orderResponse?.biz_content?.prepay_id ||
    orderResponse?.prepay_id ||
    orderResponse?.data?.prepay_id;

  const paymentUrl =
    orderResponse?.biz_content?.prepay_url ||
    orderResponse?.prepay_url ||
    orderResponse?.data?.prepay_url ||
    null;

  return {
    fabricToken,
    authToken,
    prepayId,
    paymentUrl,
    raw: orderResponse,
  };
};

module.exports = {
  applyFabricToken,
  getAuthToken,
  createOrder,
  queryOrder,
  initiatePayment,
};