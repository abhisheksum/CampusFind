const AppError = require('../utils/errors');

function authorizeRoles(...roles) {
  return function roleMiddleware(request, _response, next) {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new AppError('You are not authorized to perform this action.', 403, 'FORBIDDEN'));
    }

    return next();
  };
}

module.exports = authorizeRoles;

