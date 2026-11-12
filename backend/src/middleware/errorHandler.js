function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details;
  let message = error.message || 'An unexpected error occurred.';

  if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'A resource with one of these values already exists.';
    details = Object.keys(error.keyPattern || {});
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'One or more identifiers are invalid.';
  }

  if (error.name === 'ValidationError') {
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(error);
  }

  return response.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = errorHandler;

