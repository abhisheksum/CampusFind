const mongoose = require('mongoose');
const AppError = require('../utils/errors');
const { ItemReport, Notification } = require('../models');
const { serializeNotification } = require('../utils/notification');

function assertObjectId(value, field) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${field}.`, 400, 'INVALID_IDENTIFIER');
  }
}

async function listNotifications(user, filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
  const query = { recipientId: user._id };
  if (filters.read === 'true') query.isRead = true;
  if (filters.read === 'false' || filters.read === 'unread') query.isRead = false;
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(query)
  ]);
  return {
    notifications: notifications.map(serializeNotification),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function unreadCount(user) {
  return Notification.countDocuments({ recipientId: user._id, isRead: false });
}

async function markRead(notificationId, user) {
  assertObjectId(notificationId, 'notification ID');
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: user._id },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  return notification;
}

async function markAllRead(user) {
  const result = await Notification.updateMany(
    { recipientId: user._id, isRead: false },
    { $set: { isRead: true } }
  );
  return { updatedCount: result.modifiedCount };
}

async function deleteNotification(notificationId, user) {
  assertObjectId(notificationId, 'notification ID');
  const result = await Notification.deleteOne({ _id: notificationId, recipientId: user._id });
  if (!result.deletedCount) throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
}

async function createPotentialMatchNotifications(reportId, ownerId, matches) {
  if (!matches.length) return;
  const candidateIds = matches.map((match) => match.reportId);
  const candidates = await ItemReport.find({ _id: { $in: candidateIds } }).select('_id ownerId');
  const candidateOwners = new Map(candidates.map((candidate) => [candidate._id.toString(), candidate.ownerId]));
  const notifications = [];
  for (const match of matches) {
    const candidateOwnerId = candidateOwners.get(match.reportId);
    if (!candidateOwnerId) continue;
    const recipients = [
      { recipientId: ownerId, relatedEntityId: match.reportId },
      { recipientId: candidateOwnerId, relatedEntityId: reportId }
    ];
    for (const recipient of recipients) {
      const exists = await Notification.exists({
        recipientId: recipient.recipientId,
        type: 'possible_match',
        relatedEntityType: 'ItemReport',
        relatedEntityId: recipient.relatedEntityId
      });
      if (!exists) {
        notifications.push({
          recipientId: recipient.recipientId,
          type: 'possible_match',
          title: 'Potential item match',
          message: `A report has a ${match.matchPercentage}% similarity with an item you reported.`,
          relatedEntityType: 'ItemReport',
          relatedEntityId: recipient.relatedEntityId
        });
      }
    }
  }
  if (notifications.length) await Notification.insertMany(notifications);
}

module.exports = {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  createPotentialMatchNotifications
};
