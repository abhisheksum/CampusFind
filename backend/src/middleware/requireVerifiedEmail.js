const AppError = require('../utils/errors');

function requireVerifiedEmail(request, _response, next) {
  if (!request.user?.isEmailVerified) {
    return next(new AppError('Verify your email address to continue.', 403, 'EMAIL_NOT_VERIFIED'));
  }

  return next();
}

module.exports = requireVerifiedEmail;

