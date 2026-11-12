const mongoose = require('mongoose');
const AppError = require('../utils/errors');
const { AuditLog, Category, ItemReport, RecoveryClaim, User } = require('../models');
const { serializeAdminUser, serializeActivity } = require('../utils/admin');
const { serializeReport } = require('../utils/report');

const activeClaimStatuses = ['submitted', 'under_review', 'more_information_required'];
const moderationStatuses = ['draft', 'published', 'under_review', 'matched', 'claim_pending', 'recovered', 'closed', 'rejected', 'archived'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertObjectId(value, field) {
  if (!mongoose.isValidObjectId(value)) throw new AppError(`Invalid ${field}.`, 400, 'INVALID_IDENTIFIER');
}

function assertAdmin(user) {
  if (user.role !== 'admin') throw new AppError('Administrator access is required.', 403, 'FORBIDDEN');
}

async function getDashboard() {
  const [userStats, reportStats, statusStats, typeStats, recoveryStats, pendingClaims, categoryStats, trends] = await Promise.all([
    User.aggregate([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }]),
    ItemReport.aggregate([{ $group: { _id: '$reportType', count: { $sum: 1 } } }]),
    ItemReport.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ItemReport.aggregate([{ $group: { _id: '$reportType', count: { $sum: 1 } } }]),
    ItemReport.aggregate([{ $group: { _id: null, total: { $sum: 1 }, recovered: { $sum: { $cond: [{ $eq: ['$status', 'recovered'] }, 1, 0] } } } }]),
    RecoveryClaim.countDocuments({ status: { $in: activeClaimStatuses } }),
    ItemReport.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$category.name', 'Uncategorized'] }, count: 1 } },
      { $sort: { count: -1 } }
    ]),
    ItemReport.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  const users = userStats[0] || { total: 0, active: 0 };
  const reports = Object.fromEntries(reportStats.map((entry) => [entry._id, entry.count]));
  const statuses = Object.fromEntries(statusStats.map((entry) => [entry._id, entry.count]));
  const types = Object.fromEntries(typeStats.map((entry) => [entry._id, entry.count]));
  const recovery = recoveryStats[0] || { total: 0, recovered: 0 };
  return {
    metrics: {
      totalUsers: users.total,
      activeUsers: users.active,
      totalLostReports: reports.lost || 0,
      totalFoundReports: reports.found || 0,
      recoveredItems: recovery.recovered,
      pendingClaims,
      reportsAwaitingModeration: statuses.under_review || 0
    },
    reportsByStatus: statuses,
    lostFound: { lost: types.lost || 0, found: types.found || 0 },
    recovery: {
      totalReports: recovery.total,
      recovered: recovery.recovered,
      rate: recovery.total ? Math.round((recovery.recovered / recovery.total) * 1000) / 10 : 0
    },
    categoryDistribution: categoryStats,
    trends
  };
}

async function listActivity(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const query = {};
  if (filters.entityType) query.entityType = filters.entityType;
  const activity = await AuditLog.find(query)
    .populate('actorId', 'name role')
    .sort({ createdAt: -1 })
    .limit(limit);
  return activity.map(serializeActivity);
}

async function listReports(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.reportType) query.reportType = filters.reportType;
  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search.trim()), 'i');
    query.$or = [{ title: search }, { description: search }];
  }
  const [reports, total] = await Promise.all([
    ItemReport.find(query)
      .populate('category', 'name')
      .populate('location', 'name building')
      .populate('ownerId', 'name department avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ItemReport.countDocuments(query)
  ]);
  return {
    reports: reports.map(serializeReport),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function listUsers(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.isActive !== undefined && filters.isActive !== '') query.isActive = filters.isActive === 'true';
  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search.trim()), 'i');
    query.$or = [{ name: search }, { email: search }, { studentId: search }];
  }
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query)
  ]);
  return {
    users: users.map(serializeAdminUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function updateUserStatus(userId, isActive, actor) {
  assertAdmin(actor);
  assertObjectId(userId, 'user ID');
  if (userId.toString() === actor._id.toString()) {
    throw new AppError('You cannot change your own account status.', 403, 'SELF_ADMIN_ACTION');
  }
  const target = await User.findById(userId).select('name role isActive');
  if (!target) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  if (!isActive && target.role === 'admin' && target.isActive) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) throw new AppError('The last active administrator cannot be deactivated.', 409, 'LAST_ADMIN_PROTECTED');
  }
  const update = { $set: { isActive: Boolean(isActive) } };
  if (!isActive) update.$inc = { authVersion: 1, refreshTokenVersion: 1 };
  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  await AuditLog.create({
    actorId: actor._id,
    action: isActive ? 'user_reactivated' : 'user_deactivated',
    entityType: 'User',
    entityId: target._id,
    metadata: { previousStatus: target.isActive, isActive: Boolean(isActive) }
  });
  return user;
}

async function updateUserRole(userId, role, actor) {
  assertAdmin(actor);
  assertObjectId(userId, 'user ID');
  if (userId.toString() === actor._id.toString()) {
    throw new AppError('You cannot change your own role.', 403, 'SELF_ADMIN_ACTION');
  }
  if (!['student', 'moderator', 'admin'].includes(role)) {
    throw new AppError('Role is invalid.', 400, 'INVALID_ROLE');
  }
  const target = await User.findById(userId).select('name role isActive');
  if (!target) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  if (target.role === 'admin' && role !== 'admin' && target.isActive) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) throw new AppError('The last active administrator cannot be demoted.', 409, 'LAST_ADMIN_PROTECTED');
  }
  const user = await User.findByIdAndUpdate(userId, { $set: { role }, $inc: { authVersion: 1 } }, { new: true });
  await AuditLog.create({
    actorId: actor._id,
    action: 'user_role_changed',
    entityType: 'User',
    entityId: target._id,
    metadata: { previousRole: target.role, role }
  });
  return user;
}

module.exports = {
  getDashboard,
  listActivity,
  listReports,
  listUsers,
  updateUserStatus,
  updateUserRole,
  assertAdmin,
  moderationStatuses
};
