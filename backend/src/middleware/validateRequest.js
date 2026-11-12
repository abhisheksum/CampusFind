const { validationResult } = require('express-validator');
const AppError = require('../utils/errors');

function validateRequest(request, _response, next) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return next(
      new AppError(
        'Request validation failed.',
        400,
        'VALIDATION_ERROR',
        errors.array().map((error) => ({
          field: error.path,
          message: error.msg
        }))
      )
    );
  }

  return next();
}

module.exports = validateRequest;

