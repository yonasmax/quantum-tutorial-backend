const twilio = require('twilio');

// Check if Twilio credentials are set
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio initialized');
  } catch (err) {
    console.log('⚠️ Twilio not configured - SMS will be simulated');
  }
}

// ================================================================
// SEND SMS (Basic)
// ================================================================
exports.sendSMS = async ({ to, message }) => {
  try {
    if (!client) {
      console.log('📱 [SMS SIMULATED] To:', to);
      console.log('📱 [SMS SIMULATED] Message:', message);
      return { sid: 'SIMULATED', status: 'simulated' };
    }

    const result = await client.messages.create({
      body: message,
      to: to,
      from: fromPhone
    });
    console.log(`📱 SMS sent to ${to}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('❌ SMS error:', error.message);
    return { error: error.message };
  }
};

// ================================================================
// SEND PARENT SMS NOTIFICATION
// ================================================================
exports.sendParentSMS = async ({ phone, studentName, message }) => {
  const smsMessage = `📚 Quantum Tutorial\n\n${studentName}: ${message}\n\n✠ በእግዚአብሔር ተስፋ አለን`;
  return exports.sendSMS({ to: phone, message: smsMessage });
};

// ================================================================
// SEND EXAM RESULT SMS
// ================================================================
exports.sendExamResultSMS = async ({ phone, studentName, examTitle, percentage, isPassed }) => {
  const smsMessage = `📝 ${studentName} scored ${percentage}% on "${examTitle}" - ${isPassed ? '✅ PASSED' : '❌ FAILED'}`;
  return exports.sendSMS({ to: phone, message: smsMessage });
};

// ================================================================
// SEND MONTHLY REPORT SMS
// ================================================================
exports.sendMonthlyReportSMS = async ({ phone, studentName, average, grade }) => {
  const smsMessage = `📊 ${studentName}'s monthly average: ${average}% (Grade: ${grade}) - Quantum Tutorial`;
  return exports.sendSMS({ to: phone, message: smsMessage });
};