const crypto = require('crypto');

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function tokensMatch(token, tokenHash) {
  if (!token || !tokenHash) return false;

  const expected = Buffer.from(hashToken(token), 'hex');
  const actual = Buffer.from(tokenHash, 'hex');

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = {
  generateSecureToken,
  hashToken,
  tokensMatch
};

