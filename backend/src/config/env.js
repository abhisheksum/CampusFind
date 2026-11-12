const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '../../.env')
});

const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL'
];

for (const variable of required) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'campusfind_refresh',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  verificationTokenExpiresMinutes: Number(process.env.VERIFICATION_TOKEN_EXPIRES_MINUTES) || 30,
  passwordResetTokenExpiresMinutes: Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES) || 30,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'campusfind/reports'
  },
  matching: {
    weights: {
      category: Number(process.env.MATCH_WEIGHT_CATEGORY) || 25,
      name: Number(process.env.MATCH_WEIGHT_NAME) || 25,
      description: Number(process.env.MATCH_WEIGHT_DESCRIPTION) || 15,
      location: Number(process.env.MATCH_WEIGHT_LOCATION) || 15,
      date: Number(process.env.MATCH_WEIGHT_DATE) || 10,
      attributes: Number(process.env.MATCH_WEIGHT_ATTRIBUTES) || 10
    },
    dateWindowDays: Number(process.env.MATCH_DATE_WINDOW_DAYS) || 30,
    minimumScore: Number(process.env.MATCH_MINIMUM_SCORE) || 25,
    defaultLimit: Number(process.env.MATCH_DEFAULT_LIMIT) || 10,
    maxLimit: Number(process.env.MATCH_MAX_LIMIT) || 50
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    requireTls: process.env.SMTP_REQUIRE_TLS !== 'false',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM
  }
});

module.exports = config;

