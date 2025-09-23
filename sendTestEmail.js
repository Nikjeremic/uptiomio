const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: node sendTestEmail.js <toEmail>');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: !!process.env.SMTP_SECURE && process.env.SMTP_SECURE !== 'false',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@uptiomio.local',
      to,
      subject: 'Uptiomio SMTP test',
      text: 'Ovo je test poruka poslata iz sendTestEmail.js',
    });
    console.log('Sent:', { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response });
  } catch (err) {
    console.error('Send error:', err);
    process.exit(1);
  }
}

main(); 