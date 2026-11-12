const authenticateUser = require('./authenticateUser');

function authenticateOptional(request, response, next) {
  if (!request.get('authorization')) return next();
  return authenticateUser(request, response, next);
}

module.exports = authenticateOptional;

