const { getEmailTransportStatus, verifyEmailTransport } = require('../services/mailer');

(async () => {
  const status = getEmailTransportStatus();
  console.log('SMTP configuration status:', status);
  try {
    await verifyEmailTransport();
    console.log('SMTP connection verified.');
  } catch (error) {
    console.error('SMTP connection verification failed:', {
      code: error.code || 'SMTP_ERROR',
      responseCode: error.responseCode,
      command: error.command
    });
    process.exitCode = 1;
  }
})();
