const { body, param, query } = require('express-validator');

const userId = param('userId').isMongoId().withMessage('User ID is invalid.');
const reportId = param('reportId').isMongoId().withMessage('Report ID is invalid.');
const pagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.')
];
const reportListValidators = [
  ...pagination,
  query('status').optional().isIn(['draft', 'published', 'under_review', 'matched', 'claim_pending', 'recovered', 'closed', 'rejected', 'archived']).withMessage('Report status is invalid.'),
  query('reportType').optional().isIn(['lost', 'found']).withMessage('Report type is invalid.'),
  query('search').optional().trim().isLength({ max: 160 }).withMessage('Search is too long.')
];
const userListValidators = [
  ...pagination,
  query('role').optional().isIn(['student', 'moderator', 'admin']).withMessage('Role is invalid.'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('Account status is invalid.'),
  query('search').optional().trim().isLength({ max: 160 }).withMessage('Search is too long.')
];
const activityValidators = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100.'),
  query('entityType').optional().isIn(['ItemReport', 'RecoveryClaim', 'User', 'System']).withMessage('Entity type is invalid.')
];
const statusValidators = [
  userId,
  body('isActive').isBoolean().toBoolean().withMessage('isActive must be boolean.')
];
const roleValidators = [
  userId,
  body('role').isIn(['student', 'moderator', 'admin']).withMessage('Role is invalid.')
];
const moderateValidators = [
  reportId,
  body('status').isIn(['draft', 'published', 'under_review', 'matched', 'claim_pending', 'recovered', 'closed', 'rejected', 'archived']).withMessage('Moderation status is invalid.'),
  body('reason').optional().trim().isLength({ max: 2000 }).withMessage('Moderation reason cannot exceed 2000 characters.')
];

module.exports = {
  reportListValidators,
  userListValidators,
  activityValidators,
  statusValidators,
  roleValidators,
  moderateValidators
};
