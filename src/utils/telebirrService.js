const https = require('https');
const crypto = require('crypto');
const qs = require('querystring');

const TELEBIRR_BASE_URL = 'https://developerportal.ethiotelecom.et:9443';

// ================================================================
// STEP 1: ApplyFabricToken
// ================================================================
async function applyFabricToken() {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': process.env.TELEBIRR_APP_ID
    }
  };

  const body = JSON.stringify({
    appSecret: process.env.TELEBIRR_APP_SECRET
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${TELEBIRR_BASE_URL}/payment/v1/token`,
      options,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.token || parsed.access_token);
          } catch (err) {
            reject(new Error('Failed to parse ApplyFabricToken response: ' + data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ================================================================
// STEP 2: AuthToken
// ================================================================
async function getAuthToken(fabricToken) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': process.env.TELEBIRR_APP_ID,
      Authorization: fabricToken
    }
  };

  const body = JSON.stringify({
    merchCode: process.env.TELEBIRR_MERCHANT_CODE
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${TELEBIRR_BASE_URL}/payment/v1/auth/token`,
      options,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.token || parsed.access_token);
          } catch (err) {
            reject(new Error('Failed to parse AuthToken response: ' + data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ================================================================
// STEP 3: CreateOrder
// ================================================================
async function createOrder(authToken, { amount, orderId, title }) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': process.env.TELEBIRR_APP_ID,
      Authorization: authToken
    }
  };

  const body = JSON.stringify({
    nonceStr: crypto.randomBytes(16).toString('hex'),
    merchantCode: process.env.TELEBIRR_MERCHANT_CODE,
    merchOrderId: orderId,
    amount: amount.toString(),
    title: title,
    callbackInfo: 'Quantum Tutorial payment',
    timeoutExpress: '30',
    notifyUrl: process.env.TELEBIRR_NOTIFY_URL || '',
    redirectUrl: process.env.TELEBIRR_REDIRECT_URL || ''
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${TELEBIRR_BASE_URL}/payment/v1/merchant/preOrder`,
      options,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error('Failed to parse CreateOrder response: ' + data));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ================================================================
// COMPLETE FLOW: Initiate Payment
// ================================================================
exports.initiatePayment = async ({ amount, orderId, title }) => {
  try {
    console.log('🔄 Step 1: ApplyFabricToken...');
    const fabricToken = await applyFabricToken();
    console.log('✅ Fabric token received');

    console.log('🔄 Step 2: AuthToken...');
    const authToken = await getAuthToken(fabricToken);
    console.log('✅ Auth token received');

    console.log('🔄 Step 3: CreateOrder...');
    const order = await createOrder(authToken, { amount, orderId, title });
    console.log('✅ Order created:', order);

    return {
      success: true,
      checkoutUrl: order.checkoutUrl || order.prepayId,
      prepayId: order.prepayId,
      raw: order
    };
  } catch (error) {
    console.error('❌ Telebirr payment error:', error.message);
    throw error;
  }
};

// ================================================================
// Verify Payment (after webhook notification)
// ================================================================
exports.verifyPayment = async (orderId) => {
  try {
    const fabricToken = await applyFabricToken();
    const authToken = await getAuthToken(fabricToken);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': process.env.TELEBIRR_APP_ID,
        Authorization: authToken
      }
    };

    const body = JSON.stringify({
      merchantCode: process.env.TELEBIRR_MERCHANT_CODE,
      merchOrderId: orderId
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        `${TELEBIRR_BASE_URL}/payment/v1/merchant/order/query`,
        options,
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    throw error;
  }
};