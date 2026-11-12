const asyncHandler = require('../utils/asyncHandler');
const { serializeUser } = require('../utils/user');
const authService = require('../services/auth.service');
const config = require('../config/env');

function setRefreshCookie(response, refreshToken) {
  response.cookie(config.refreshCookieName, refreshToken, authService.getRefreshCookieOptions());
}

function clearRefreshCookie(response) {
  response.clearCookie(config.refreshCookieName, authService.getRefreshCookieOptions());
}

const register = asyncHandler(async (request, response) => {
  const user = await authService.registerUser(request.body);
  response.status(201).json({
    success: true,
    data: {
      user: serializeUser(user),
      message: 'Account created. Check your email to verify your account.'
    }
  });
});

const login = asyncHandler(async (request, response) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(request.body);
  setRefreshCookie(response, refreshToken);
  response.json({
    success: true,
    data: {
      user: serializeUser(user),
      accessToken
    }
  });
});

const refresh = asyncHandler(async (request, response) => {
  try {
    const { user, accessToken, refreshToken } = await authService.refreshUserSession(
      request.cookies[config.refreshCookieName]
    );
    setRefreshCookie(response, refreshToken);
    response.json({
      success: true,
      data: {
        user: serializeUser(user),
        accessToken
      }
    });
  } catch (error) {
    clearRefreshCookie(response);
    throw error;
  }
});

const logout = asyncHandler(async (request, response) => {
  await authService.logoutUser(request.cookies[config.refreshCookieName]);
  clearRefreshCookie(response);
  response.status(204).send();
});

const verifyEmail = asyncHandler(async (request, response) => {
  await authService.verifyEmail(request.body.token);
  response.json({
    success: true,
    data: { message: 'Email verified successfully. You can now sign in.' }
  });
});

const resendVerification = asyncHandler(async (request, response) => {
  await authService.resendVerificationEmail(request.body.email);
  response.json({
    success: true,
    data: { message: 'If an unverified account exists, a verification email has been sent.' }
  });
});

const forgotPassword = asyncHandler(async (request, response) => {
  await authService.requestPasswordReset(request.body.email);
  response.json({
    success: true,
    data: { message: 'If an account exists, password reset instructions have been sent.' }
  });
});

const resetPassword = asyncHandler(async (request, response) => {
  await authService.resetPassword(request.body);
  response.json({
    success: true,
    data: { message: 'Password reset successfully. Sign in with your new password.' }
  });
});

const me = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { user: serializeUser(request.user) } });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me
};

