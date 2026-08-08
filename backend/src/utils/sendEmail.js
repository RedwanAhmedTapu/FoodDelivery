const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });
  }
  return transporter;
}

/**
 * Best-effort email send. Returns false (never throws) if email isn't
 * configured or sending fails — callers should treat email as an optional
 * *extra* channel, not a dependency. The in-app OTP display + Socket.IO
 * push are the guaranteed, always-free delivery path.
 */
async function sendEmail({ to, subject, html }) {
  const client = getTransporter();
  if (!client) return false;

  try {
    await client.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[email] Failed to send email:', err.message);
    return false;
  }
}

module.exports = { sendEmail };
