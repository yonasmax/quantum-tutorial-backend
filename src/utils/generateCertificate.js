const PDFDocument = require('pdfkit');

/**
 * Generate a PDF certificate buffer for a passed exam.
 */
const generateCertificate = ({
  studentName,
  examTitle,
  subject,
  grade,
  percentage,
  obtainedMarks,
  totalMarks,
  verificationCode,
  issuedAt,
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
        info: {
          Title: `Certificate - ${studentName}`,
          Author: 'Quantum Center of Intellect',
          Subject: `${examTitle} — ${subject} Grade ${grade}`,
          Keywords: 'certificate, exam, quantum',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;

      // Background
      doc.rect(0, 0, W, H).fill('#fff8e7');

      // Outer gold border
      doc
        .lineWidth(12)
        .strokeColor('#8a6b1f')
        .rect(20, 20, W - 40, H - 40)
        .stroke();

      // Inner gold border
      doc
        .lineWidth(3)
        .strokeColor('#d4af37')
        .rect(40, 40, W - 80, H - 80)
        .stroke();

      // Corner crosses
      const crossPositions = [
        { x: 70, y: 70 },
        { x: W - 90, y: 70 },
        { x: 70, y: H - 90 },
        { x: W - 90, y: H - 90 },
      ];
      crossPositions.forEach(({ x, y }) => {
        doc
          .fontSize(28)
          .fillColor('#d4af37')
          .font('Helvetica-Bold')
          .text('✠', x, y, { width: 40, align: 'center' });
      });

      // Brand
      doc
        .fillColor('#8e1616')
        .font('Helvetica-Bold')
        .fontSize(38)
        .text('QUANTUM CENTER OF INTELLECT', 0, 100, {
          width: W,
          align: 'center',
        });

      doc
        .fillColor('#b8941f')
        .font('Helvetica')
        .fontSize(13)
        .text('• MASTER THE QUANTUM REALM •', 0, 148, {
          width: W,
          align: 'center',
          characterSpacing: 3,
        });

      // Title
      doc
        .fillColor('#5a2e0a')
        .font('Helvetica-Bold')
        .fontSize(30)
        .text('CERTIFICATE OF ACHIEVEMENT', 0, 200, {
          width: W,
          align: 'center',
        });

      // Subtitle
      doc
        .fillColor('#7a5a3a')
        .font('Helvetica')
        .fontSize(14)
        .text('This certificate is proudly presented to', 0, 250, {
          width: W,
          align: 'center',
        });

      // Student Name
      doc
        .fillColor('#8e1616')
        .font('Helvetica-Bold')
        .fontSize(42)
        .text(studentName, 0, 285, {
          width: W,
          align: 'center',
        });

      // Underline
      const nameLine = 345;
      doc
        .lineWidth(2)
        .strokeColor('#d4af37')
        .moveTo(W / 2 - 250, nameLine)
        .lineTo(W / 2 + 250, nameLine)
        .stroke();

      // Achievement text
      doc
        .fillColor('#3a2410')
        .font('Helvetica')
        .fontSize(14)
        .text('for successfully completing the exam', 0, 365, {
          width: W,
          align: 'center',
        });

      doc
        .fillColor('#5a2e0a')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text(examTitle, 0, 390, { width: W, align: 'center' });

      doc
        .fillColor('#7a5a3a')
        .font('Helvetica')
        .fontSize(13)
        .text(`${subject} · Grade ${grade}`, 0, 420, {
          width: W,
          align: 'center',
        });

      // Score box
      const scoreBoxY = 450;
      doc
        .roundedRect(W / 2 - 220, scoreBoxY, 440, 55, 10)
        .fillAndStroke('#fffdf5', '#d4af37');

      doc
        .fillColor('#5a2e0a')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text(
          `Score: ${obtainedMarks}/${totalMarks}  ·  ${percentage}%`,
          0,
          scoreBoxY + 16,
          { width: W, align: 'center' }
        );

      // Footer
      const dateStr = new Date(issuedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc
        .fillColor('#7a5a3a')
        .font('Helvetica')
        .fontSize(10)
        .text(`Issued on ${dateStr}`, 70, H - 75);

      doc
        .fillColor('#7a5a3a')
        .font('Helvetica')
        .fontSize(10)
        .text(
          `Verification code: ${verificationCode}`,
          W - 320,
          H - 75,
          { width: 250, align: 'right' }
        );

      doc
        .fillColor('#b8941f')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Verify at: quantum-tutorial.vercel.app/verify', 0, H - 55, {
          width: W,
          align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateCertificate;