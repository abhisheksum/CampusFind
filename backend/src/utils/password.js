const bcrypt = require('bcryptjs');

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

function validatePasswordStrength(password) {
  return typeof password === 'string' && PASSWORD_PATTERN.test(password);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  validatePasswordStrength,
  hashPassword,
  comparePassword
};

