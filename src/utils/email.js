const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ================================================================
// SEND EMAIL (Basic)
// ================================================================
exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Quantum Tutorial" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: html || `<p>${text || ''}</p>`,
      text: text || ''
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw error;
  }
};

// ================================================================
// SEND PARENT NOTIFICATION
// ================================================================
exports.sendParentNotification = async ({ parentEmail, studentName, subject, message, result }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; background: #8e1616; padding: 25px; border-radius: 10px 10px 0 0; color: #d4af37;">
        <h1 style="margin: 0; font-size: 24px;">✠ ☧ ☦ ✠</h1>
        <h2 style="margin: 10px 0 0; color: white;">Quantum Tutorial</h2>
        <p style="margin: 5px 0 0; opacity: 0.9; color: #d4af37;">Parent Notification</p>
      </div>
      <div style="padding: 25px; background: #fdfaf6;">
        <h3 style="color: #8e1616; margin-top: 0;">Dear Parent,</h3>
        <p style="color: #333; line-height: 1.6;">
          This is a notification regarding your child's progress at <strong>Quantum Tutorial</strong>.
        </p>
        <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
          <p style="margin: 8px 0; color: #333;"><strong>👨‍🎓 Student:</strong> ${studentName}</p>
          <p style="margin: 8px 0; color: #333;"><strong>📚 Subject:</strong> ${subject}</p>
          <p style="margin: 8px 0; color: #333;"><strong>📝 Message:</strong> ${message}</p>
          ${result ? `<p style="margin: 8px 0; color: #333;"><strong>📊 Result:</strong> ${result}</p>` : ''}
        </div>
        <p style="color: #333; line-height: 1.6;">
          Thank you for entrusting us with your child's education.
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}" 
             style="background: #8e1616; color: #d4af37; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Full Report
          </a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 25px; border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center;">
          <strong>Quantum Tutorial System</strong><br>
          የምስካዬ ኅዙናን መድኃኔዓለም ገዳም ትምህርት ቤት<br>
          <em>✠ በእግዚአብሔር ተስፋ አለን ✠</em>
        </p>
      </div>
    </div>
  `;

  return exports.sendEmail({
    to: parentEmail,
    subject: `📊 ${studentName}'s Progress Update - Quantum Tutorial`,
    html
  });
};

// ================================================================
// SEND PERFORMANCE REPORT
// ================================================================
exports.sendPerformanceReport = async ({ 
  parentEmail, 
  studentName, 
  subject, 
  average, 
  grade, 
  rank,
  exams,
  attendance 
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; background: #8e1616; padding: 25px; border-radius: 10px 10px 0 0; color: #d4af37;">
        <h1 style="margin: 0; font-size: 28px;">✠ ☧ ☦ ✠</h1>
        <h2 style="margin: 10px 0 0; color: white;">Monthly Performance Report</h2>
        <p style="margin: 5px 0 0; color: #d4af37;">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>
      <div style="padding: 25px; background: #fdfaf6;">
        <h3 style="color: #8e1616;">Dear Parent of ${studentName},</h3>
        <p style="color: #333; line-height: 1.6;">
          Here is your child's performance report for the past month:
        </p>

        <div style="background: linear-gradient(135deg, #8e1616, #4a0000); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #d4af37; font-size: 14px;">AVERAGE SCORE</p>
          <p style="margin: 5px 0; color: white; font-size: 48px; font-weight: bold;">${average}%</p>
          <p style="margin: 0; color: #d4af37; font-size: 16px;">Grade: ${grade} • Rank: ${rank}</p>
        </div>

        <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
          <h4 style="margin: 0 0 10px; color: #8e1616;">📊 Subject: ${subject}</h4>
          ${exams ? `<p style="margin: 8px 0; color: #333;"><strong>Exams Taken:</strong> ${exams}</p>` : ''}
          ${attendance ? `<p style="margin: 8px 0; color: #333;"><strong>Attendance:</strong> ${attendance}</p>` : ''}
        </div>

        <p style="color: #333; line-height: 1.6;">
          We encourage you to review this report with your child and celebrate their progress. 
          For any questions, please contact the school administration.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}" 
             style="background: #8e1616; color: #d4af37; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Full Report Card
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 25px; border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center;">
          <strong>Quantum Tutorial System</strong><br>
          የምስካዬ ኅዙናን መድኃኔዓለም ገዳም ትምህርት ቤት<br>
          <em>✠ በእግዚአብሔር ተስፋ አለን ✠</em>
        </p>
      </div>
    </div>
  `;

  return exports.sendEmail({
    to: parentEmail,
    subject: `📊 ${studentName}'s Monthly Performance Report - Quantum Tutorial`,
    html
  });
};

// ================================================================
// SEND EXAM RESULT NOTIFICATION
// ================================================================
exports.sendExamResultNotification = async ({ 
  parentEmail, 
  studentName, 
  examTitle, 
  subject, 
  score, 
  totalMarks, 
  percentage, 
  isPassed 
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; background: #8e1616; padding: 25px; border-radius: 10px 10px 0 0; color: #d4af37;">
        <h1 style="margin: 0; font-size: 28px;">${isPassed ? '🎉' : '📝'}</h1>
        <h2 style="margin: 10px 0 0; color: white;">Exam Result Notification</h2>
      </div>
      <div style="padding: 25px; background: #fdfaf6;">
        <h3 style="color: #8e1616;">Dear Parent of ${studentName},</h3>
        <p style="color: #333; line-height: 1.6;">
          Your child has completed an exam. Here is the result:
        </p>

        <div style="background: ${isPassed ? '#e8f5e9' : '#ffebee'}; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; border: 2px solid ${isPassed ? '#4caf50' : '#f44336'};">
          <p style="margin: 0; color: #666; font-size: 14px;">${examTitle}</p>
          <p style="margin: 10px 0; color: ${isPassed ? '#2e7d32' : '#c62828'}; font-size: 42px; font-weight: bold;">
            ${percentage}%
          </p>
          <p style="margin: 0; color: #333; font-size: 16px;">
            ${score} / ${totalMarks} marks
          </p>
          <p style="margin: 10px 0 0; color: ${isPassed ? '#2e7d32' : '#c62828'}; font-size: 20px; font-weight: bold;">
            ${isPassed ? '✅ PASSED' : '❌ FAILED'}
          </p>
        </div>

        <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
          <p style="margin: 0; color: #333;"><strong>📚 Subject:</strong> ${subject}</p>
        </div>

        <p style="color: #333; line-height: 1.6;">
          ${isPassed 
            ? 'Congratulations! Your child performed excellently. Keep encouraging them!' 
            : 'Please encourage your child to study more. We are here to support their learning journey.'}
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}/exams" 
             style="background: #8e1616; color: #d4af37; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Full Result
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 25px; border-top: 1px solid #e0e0e0; padding-top: 15px; text-align: center;">
          <strong>Quantum Tutorial System</strong><br>
          <em>✠ በእግዚአብሔር ተስፋ አለን ✠</em>
        </p>
      </div>
    </div>
  `;

  return exports.sendEmail({
    to: parentEmail,
    subject: `📝 ${studentName}'s Exam Result: ${examTitle}`,
    html
  });
};