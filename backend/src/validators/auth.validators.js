const { body } = require('express-validator');

const email = body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address.')
  .normalizeEmail();

const password = body('password')
  .isString()
  .withMessage('Password is required.')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters.');

const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  email,
  body('studentId')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Student ID must be 2-50 characters.')
    .customSanitizer((value) => value.toUpperCase()),
  body('department')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Department must be 2-120 characters.'),
  password,
  body('confirmPassword')
    .isString()
    .withMessage('Confirm password is required.')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.')
];

const loginValidators = [email, body('password').isString().withMessage('Password is required.')];

const verifyEmailValidators = [
  body('token').trim().isLength({ min: 32, max: 128 }).withMessage('Verification token is required.')
];

const forgotPasswordValidators = [email];

const resetPasswordValidators = [
  body('token').trim().isLength({ min: 32, max: 128 }).withMessage('Reset token is required.'),
  password,
  body('confirmPassword')
    .isString()
    .withMessage('Confirm password is required.')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.')
];

const changePasswordValidators = [
  body('currentPassword').isString().withMessage('Current password is required.'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters.'),
  body('confirmPassword')
    .isString()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match.')
];

const profileValidators = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Department must be 2-120 characters.'),
  body('avatarUrl')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Avatar URL must be a valid HTTP or HTTPS URL.')
];

module.exports = {
  registerValidators,
  loginValidators,
  verifyEmailValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
  profileValidators
};

