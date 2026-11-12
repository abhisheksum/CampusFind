const crypto = require('crypto');
const AppError = require('../utils/errors');
const config = require('../config/env');
const { User } = require('../models');
const { generateSecureToken, hashToken, tokensMatch } = require('../utils/crypto');
const { comparePassword, hashPassword, validatePasswordStrength } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail, sendVerificationEmail } = require('./mailer');

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizeStudentId(studentId) {
  return studentId.trim().toUpperCase();
}

function assertStrongPassword(password) {
  if (!validatePasswordStrength(password)) {
    throw new AppError(
      'Password must be 8-128 characters and include uppercase, lowercase, number, and special character.',
      400,
      'WEAK_PASSWORD'
    );
  }
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth'
  };
}

function createTokenPair(user) {
  const tokenId = generateSecureToken();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, tokenId);

  return {
    accessToken,
    refreshToken,
    refreshTokenHash: hashToken(refreshToken)
  };
}

async function registerUser({ name, email, studentId, department, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedStudentId = normalizeStudentId(studentId);

  assertStrongPassword(password);

  const duplicate = await User.findOne({
    $or: [{ email: normalizedEmail }, { studentId: normalizedStudentId }]
  })
    .select('email studentId')
    .lean();

  if (duplicate) {
    const field = duplicate.email === normalizedEmail ? 'email' : 'studentId';
    throw new AppError(
      `An account with this ${field} already exists.`,
      409,
      `DUPLICATE_${field.toUpperCase()}`
    );
  }

  const verificationToken = generateSecureToken();
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    studentId: normalizedStudentId,
    department: department.trim(),
    passwordHash: await hashPassword(password),
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: new Date(
      Date.now() + config.verificationTokenExpiresMinutes * 60 * 1000
    )
  });

  try {
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    console.error('[auth] Verification email was not sent:', {
      code: error.code || 'EMAIL_DELIVERY_FAILED'
    });
    throw new AppError(
      error.code === 'SMTP_NOT_CONFIGURED'
        ? 'Account could not be created because email delivery is not configured. Contact the administrator.'
        : 'Account could not be created because verification email delivery failed. Try again later.',
      503,
      error.code === 'SMTP_NOT_CONFIGURED'
        ? 'EMAIL_DELIVERY_NOT_CONFIGURED'
        : 'EMAIL_DELIVERY_FAILED'
    );
  }

  return user;
}

async function resendVerificationEmail(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || !user.isActive || user.isEmailVerified) return false;

  const previousTokenHash = user.emailVerificationTokenHash;
  const previousTokenExpiry = user.emailVerificationExpiresAt;
  const verificationToken = generateSecureToken();
  user.emailVerificationTokenHash = hashToken(verificationToken);
  user.emailVerificationExpiresAt = new Date(
    Date.now() + config.verificationTokenExpiresMinutes * 60 * 1000
  );
  await user.save();

  try {
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken
    });
  } catch (error) {
    user.emailVerificationTokenHash = previousTokenHash;
    user.emailVerificationExpiresAt = previousTokenExpiry;
    await user.save();
    console.error('[auth] Verification email resend failed:', {
      code: error.code || 'EMAIL_DELIVERY_FAILED'
    });
    throw new AppError(
      error.code === 'SMTP_NOT_CONFIGURED'
        ? 'Email delivery is not configured. Contact the administrator.'
        : 'Verification email could not be sent. Try again later.',
      503,
      error.code === 'SMTP_NOT_CONFIGURED'
        ? 'EMAIL_DELIVERY_NOT_CONFIGURED'
        : 'EMAIL_DELIVERY_FAILED'
    );
  }

  return true;
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+passwordHash +authVersion +refreshTokenHash +refreshTokenVersion'
  );

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      'Verify your email address before signing in.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  const tokens = createTokenPair(user);
  user.refreshTokenHash = tokens.refreshTokenHash;
  user.refreshTokenVersion += 1;
  await user.save();

  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

async function refreshUserSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 401, 'INVALID_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new AppError('Refresh token is invalid or expired.', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    throw new AppError('Refresh token is invalid.', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.sub).select(
    '+refreshTokenHash +refreshTokenVersion +authVersion'
  );

  if (!user || !user.isActive) {
    throw new AppError('Refresh token is invalid.', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (!tokensMatch(refreshToken, user.refreshTokenHash)) {
    user.refreshTokenHash = null;
    user.refreshTokenVersion += 1;
    user.authVersion += 1;
    await user.save();
    throw new AppError('Refresh token reuse detected. Sign in again.', 401, 'REFRESH_TOKEN_REUSED');
  }

  const tokens = createTokenPair(user);
  user.refreshTokenHash = tokens.refreshTokenHash;
  user.refreshTokenVersion += 1;
  await user.save();

  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

async function logoutUser(refreshToken) {
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload.sub) {
        await User.findByIdAndUpdate(payload.sub, {
          $set: { refreshTokenHash: null },
          $inc: { refreshTokenVersion: 1, authVersion: 1 }
        });
      }
    } catch (_error) {
      // Always clear the client cookie, even when the token is expired.
    }
  }
}

async function verifyEmail(token) {
  if (!token) throw new AppError('Verification token is required.', 400, 'TOKEN_REQUIRED');

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() }
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');

  if (!user) {
    throw new AppError('Verification token is invalid or expired.', 400, 'INVALID_VERIFICATION_TOKEN');
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || !user.isActive) return;

  const resetToken = generateSecureToken();
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(
    Date.now() + config.passwordResetTokenExpiresMinutes * 60 * 1000
  );
  await user.save();

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: resetToken
    });
  } catch (error) {
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    throw new AppError('Password reset email could not be sent.', 503, 'EMAIL_DELIVERY_FAILED');
  }
}

async function resetPassword({ token, password }) {
  assertStrongPassword(password);

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() }
  }).select('+passwordResetTokenHash +passwordResetExpiresAt +authVersion');

  if (!user) {
    throw new AppError('Password reset token is invalid or expired.', 400, 'INVALID_RESET_TOKEN');
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = null;
  user.authVersion += 1;
  await user.save();
}

async function changePassword(userId, { currentPassword, newPassword }) {
  assertStrongPassword(newPassword);

  const user = await User.findById(userId).select('+passwordHash +authVersion');
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new AppError('Current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = null;
  user.authVersion += 1;
  await user.save();
}

module.exports = {
  registerUser,
  resendVerificationEmail,
  loginUser,
  refreshUserSession,
  logoutUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getRefreshCookieOptions
};

