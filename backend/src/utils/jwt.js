const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      authVersion: user.authVersion
    },
    config.jwtAccessSecret,
    {
      expiresIn: config.accessTokenExpiresIn,
      issuer: 'campusfind-api',
      audience: 'campusfind-web'
    }
  );
}

function signRefreshToken(user, tokenId) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: 'refresh',
      tokenId
    },
    config.jwtRefreshSecret,
    {
      expiresIn: config.refreshTokenExpiresIn,
      issuer: 'campusfind-api',
      audience: 'campusfind-web'
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtAccessSecret, {
    issuer: 'campusfind-api',
    audience: 'campusfind-web'
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwtRefreshSecret, {
    issuer: 'campusfind-api',
    audience: 'campusfind-web'
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

