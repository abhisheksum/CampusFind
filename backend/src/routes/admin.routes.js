const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateRequest = require('../middleware/validateRequest');
const {
  dashboard,
  activity,
  reports,
  users,
  updateUserStatus,
  updateUserRole,
  moderateReport
} = require('../controllers/admin.controller');
const {
  reportListValidators,
  userListValidators,
  activityValidators,
  statusValidators,
  roleValidators,
  moderateValidators
} = require('../validators/admin.validators');

const router = express.Router();

router.use(authenticateUser, requireVerifiedEmail, authorizeRoles('moderator', 'admin'));
router.get('/dashboard', dashboard);
router.get('/activity', activityValidators, validateRequest, activity);
router.get('/reports', reportListValidators, validateRequest, reports);
router.post('/reports/:reportId/moderate', moderateValidators, validateRequest, moderateReport);
router.get('/users', authorizeRoles('admin'), userListValidators, validateRequest, users);
router.patch('/users/:userId/status', authorizeRoles('admin'), statusValidators, validateRequest, updateUserStatus);
router.patch('/users/:userId/role', authorizeRoles('admin'), roleValidators, validateRequest, updateUserRole);

module.exports = router;
