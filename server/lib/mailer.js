const nodemailer = require('nodemailer');

// Messages captured when no SMTP server is configured (development and tests).
const outbox = [];

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

let transport;
function getTransport() {
  if (transport) return transport;
  if (smtpConfigured()) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
  }
  return transport;
}

function appUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function sendMail({ to, subject, text }) {
  const from = process.env.MAIL_FROM || 'Cryp-Cross <no-reply@localhost>';
  await getTransport().sendMail({ from, to, subject, text });
  if (!smtpConfigured()) {
    outbox.push({ to, subject, text });
    // Development only: there is no inbox, so show the link in the API console.
    // Never in production (server.js refuses to start without SMTP there) or tests.
    if (!['production', 'test'].includes(process.env.NODE_ENV)) {
      console.log(`\n[dev mail] To: ${to}\nSubject: ${subject}\n${text}\n`);
    }
  }
}

const sendVerificationEmail = (to, token) =>
  sendMail({
    to,
    subject: 'Verify your Cryp-Cross email',
    text: `Welcome to Cryp-Cross!\n\nConfirm your email to start solving:\n${appUrl()}/verify-email?token=${token}\n\nThe link expires in 24 hours. If you didn't sign up, ignore this email.`,
  });

const sendAlreadyRegisteredEmail = (to) =>
  sendMail({
    to,
    subject: 'Your Cryp-Cross account',
    text: `Someone tried to sign up for Cryp-Cross with this email, but it already has an account.\n\nForgot your password? Reset it here:\n${appUrl()}/forgot-password\n\nIf this wasn't you, you can ignore this email.`,
  });

const sendPasswordResetEmail = (to, token) =>
  sendMail({
    to,
    subject: 'Reset your Cryp-Cross password',
    text: `Reset your password with this link:\n${appUrl()}/reset-password?token=${token}\n\nThe link expires in 1 hour. If you didn't ask for this, ignore this email.`,
  });

module.exports = {
  outbox,
  smtpConfigured,
  sendVerificationEmail,
  sendAlreadyRegisteredEmail,
  sendPasswordResetEmail,
};
