const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');
const { serializeNotification } = require('../utils/notification');

const listNotifications = asyncHandler(async (request, response) => {
  const result = await notificationService.listNotifications(request.user, request.query);
  response.json({ success: true, data: result });
});

const unreadCount = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { count: await notificationService.unreadCount(request.user) } });
});

const markRead = asyncHandler(async (request, response) => {
  const notification = await notificationService.markRead(request.params.notificationId, request.user);
  response.json({ success: true, data: { notification: serializeNotification(notification) } });
});

const markAllRead = asyncHandler(async (request, response) => {
  const result = await notificationService.markAllRead(request.user);
  response.json({ success: true, data: result });
});

const deleteNotification = asyncHandler(async (request, response) => {
  await notificationService.deleteNotification(request.params.notificationId, request.user);
  response.status(204).send();
});

module.exports = { listNotifications, unreadCount, markRead, markAllRead, deleteNotification };
