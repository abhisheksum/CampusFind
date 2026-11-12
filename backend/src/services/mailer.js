const nodemailer = require('nodemailer');
const config = require('../config/env');

const requiredSmtpVariables = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM'];

function getEmailTransportStatus() {
  const values = {
    SMTP_HOST: config.smtp.host,
    SMTP_USER: config.smtp.user,
    SMTP_PASSWORD: config.smtp.password,
    MAIL_FROM: config.smtp.from
  };
  const missing = requiredSmtpVariables.filter((variable) => !values[variable]);

  return {
    configured: missing.length === 0,
    missing,
    hostConfigured: Boolean(values.SMTP_HOST),
    userConfigured: Boolean(values.SMTP_USER),
    passwordConfigured: Boolean(values.SMTP_PASSWORD),
    senderConfigured: Boolean(values.MAIL_FROM),
    port: config.smtp.port,
    secure: config.smtp.secure,
    requireTls: config.smtp.requireTls
  };
}

function createSmtpError(error) {
  const isAuthenticationError = error.code === 'EAUTH' || error.responseCode === 535;
  const isConnectionError = ['ECONNECTION', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code);
  const wrappedError = new Error(
    isAuthenticationError
      ? 'SMTP authentication failed.'
      : isConnectionError
        ? 'SMTP connection failed.'
        : 'SMTP email delivery failed.'
  );
  wrappedError.code = isAuthenticationError
    ? 'SMTP_AUTH_FAILED'
    : isConnectionError
      ? 'SMTP_CONNECTION_FAILED'
      : 'SMTP_DELIVERY_FAILED';
  wrappedError.responseCode = error.responseCode;
  wrappedError.command = error.command;
  return wrappedError;
}

const smtpStatus = getEmailTransportStatus();

const transporter = smtpStatus.configured
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      requireTLS: config.smtp.requireTls,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password
      }
    })
  : null;

async function sendTemplateEmail({ to, subject, text, html }) {
  if (!transporter) {
    const error = new Error('SMTP email delivery is not configured.');
    error.code = 'SMTP_NOT_CONFIGURED';
    error.missing = smtpStatus.missing;
    throw error;
  }

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html
    });
  } catch (error) {
    const smtpError = createSmtpError(error);
    console.error('[email] SMTP delivery failed:', {
      code: smtpError.code,
      responseCode: smtpError.responseCode,
      command: smtpError.command
    });
    throw smtpError;
  }
}

async function verifyEmailTransport() {
  if (!transporter) {
    const error = new Error('SMTP email delivery is not configured.');
    error.code = 'SMTP_NOT_CONFIGURED';
    error.missing = smtpStatus.missing;
    throw error;
  }

  try {
    await transporter.verify();
  } catch (error) {
    const smtpError = createSmtpError(error);
    console.error('[email] SMTP verification failed:', {
      code: smtpError.code,
      responseCode: smtpError.responseCode,
      command: smtpError.command
    });
    throw smtpError;
  }
  return true;
}

async function sendVerificationEmail({ email, name, token }) {
  const link = `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  await sendTemplateEmail({
    to: email,
    subject: 'Verify your CampusFind email',
    text: `Hi ${name}, verify your CampusFind account here: ${link}`,
    html: `<p>Hi ${name},</p><p>Verify your CampusFind account:</p><p><a href="${link}">${link}</a></p>`
  });
}

async function sendPasswordResetEmail({ email, name, token }) {
  const link = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendTemplateEmail({
    to: email,
    subject: 'Reset your CampusFind password',
    text: `Hi ${name}, reset your CampusFind password here: ${link}`,
    html: `<p>Hi ${name},</p><p>Reset your CampusFind password:</p><p><a href="${link}">${link}</a></p>`
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyEmailTransport,
  getEmailTransportStatus
};

