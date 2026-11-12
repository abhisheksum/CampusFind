const { User } = require('../models');
const AppError = require('../utils/errors');
const { verifyAccessToken } = require('../utils/jwt');

async function authenticateUser(request, _response, next) {
  try {
    const header = request.get('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError('Authentication is required.', 401, 'AUTHENTICATION_REQUIRED'));
    }

    const token = header.slice(7).trim();
    const payload = verifyAccessToken(token);
    if (payload.authVersion === undefined || !payload.sub) {
      return next(new AppError('Access token is invalid.', 401, 'INVALID_ACCESS_TOKEN'));
    }

    const user = await User.findById(payload.sub).select('+authVersion');
    if (!user || !user.isActive || user.authVersion !== payload.authVersion) {
      return next(new AppError('Access token is invalid.', 401, 'INVALID_ACCESS_TOKEN'));
    }

    request.user = user;
    return next();
  } catch (_error) {
    return next(new AppError('Access token is invalid or expired.', 401, 'INVALID_ACCESS_TOKEN'));
  }
}

module.exports = authenticateUser;

