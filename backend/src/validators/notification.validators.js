const { param, query } = require('express-validator');

const notificationId = param('notificationId').isMongoId().withMessage('Notification ID is invalid.');
const listNotificationsValidators = [
  query('read').optional().isIn(['true', 'false', 'unread']).withMessage('Read filter is invalid.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50.')
];

module.exports = { notificationId, listNotificationsValidators };
