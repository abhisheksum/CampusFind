const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const validateRequest = require('../middleware/validateRequest');
const {
  changePasswordValidators,
  profileValidators
} = require('../validators/auth.validators');
const {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/user.controller');

const router = express.Router();

router.use(authenticateUser, requireVerifiedEmail);
router.get('/me', getProfile);
router.patch('/me', profileValidators, validateRequest, updateProfile);
router.patch('/me/password', changePasswordValidators, validateRequest, changePassword);
router.delete('/me', deactivateAccount);

module.exports = router;

