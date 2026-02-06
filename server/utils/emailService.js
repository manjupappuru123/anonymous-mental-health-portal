const nodemailer = require('nodemailer');

let cachedTransporter = null;

const buildTransporter = () => {
  const brevoSmtpKey = process.env.BREVO_SMTP_KEY;
  const host = process.env.EMAIL_HOST || (brevoSmtpKey ? 'smtp-relay.brevo.com' : null);
  const port = Number.parseInt(
    process.env.EMAIL_PORT || (brevoSmtpKey ? '587' : ''),
    10
  );
  const secure = process.env.EMAIL_SECURE === 'true';
  const user = process.env.EMAIL_USER || (brevoSmtpKey ? 'apikey' : null);
  const pass = process.env.EMAIL_PASS || brevoSmtpKey || null;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 1,
    maxMessages: 20
  });
};

const getTransporter = () => {
  if (!cachedTransporter) {
    cachedTransporter = buildTransporter();
  }
  return cachedTransporter;
};

const sendIssueAssignedEmail = async ({ to, name, issueId }) => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Email disabled: missing SMTP configuration.');
    return;
  }

  const from = process.env.EMAIL_FROM || 'no-reply@mental-health-portal.local';
  const subject = 'New issue assigned';
  const greetingName = name ? ` ${name}` : '';
  const text = [
    `Hello${greetingName},`,
    '',
    'A new issue has been assigned to you. Please sign in to review it.',
    `Issue ID: ${issueId}`,
    '',
    '- Anonymous Mental Health Portal'
  ].join('\n');

  await transporter.sendMail({
    from,
    to,
    subject,
    text
  });
};

module.exports = {
  sendIssueAssignedEmail
};
