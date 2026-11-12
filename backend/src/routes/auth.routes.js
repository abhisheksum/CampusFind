const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const validateRequest = require('../middleware/validateRequest');
const { authRateLimit, registrationRateLimit } = require('../middleware/rateLimits');
const {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me
} = require('../controllers/auth.controller');
const {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  forgotPasswordValidators,
  resetPasswordValidators
} = require('../validators/auth.validators');

const router = express.Router();

router.post('/register', registrationRateLimit, registerValidators, validateRequest, register);
router.post('/login', authRateLimit, loginValidators, validateRequest, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-email', authRateLimit, verifyEmailValidators, validateRequest, verifyEmail);
router.post('/resend-verification', authRateLimit, forgotPasswordValidators, validateRequest, resendVerification);
router.post(
  '/forgot-password',
  authRateLimit,
  forgotPasswordValidators,
  validateRequest,
  forgotPassword
);
router.post(
  '/reset-password',
  authRateLimit,
  resetPasswordValidators,
  validateRequest,
  resetPassword
);
router.get('/me', authenticateUser, me);

module.exports = router;

