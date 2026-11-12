function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId?.toString?.() || notification.relatedEntityId || null,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
}

module.exports = { serializeNotification };
