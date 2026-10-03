// Simple Telebirr simulation — no SSL issues
exports.initiatePayment = async ({ orderId, amount, title }) => {
  console.log(`💰 Telebirr Payment: ${orderId} - ${amount} ETB - ${title}`);
  return {
    success: true,
    receiveCode: `TEL-${Date.now()}`,
    data: { orderId, amount, title, status: 'pending' }
  };
};

exports.confirmPayment = async (orderId) => {
  console.log(`💰 Telebirr Confirm: ${orderId}`);
  return true;
};

exports.queryPayment = async (orderId) => {
  return { trade_status: 'PAY_SUCCESS' };
};