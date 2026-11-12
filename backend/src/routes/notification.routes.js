const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const validateRequest = require('../middleware/validateRequest');
const {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification
} = require('../controllers/notification.controller');
const { notificationId, listNotificationsValidators } = require('../validators/notification.validators');

const router = express.Router();

router.use(authenticateUser, requireVerifiedEmail);
router.get('/', listNotificationsValidators, validateRequest, listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:notificationId/read', notificationId, validateRequest, markRead);
router.delete('/:notificationId', notificationId, validateRequest, deleteNotification);

module.exports = router;
