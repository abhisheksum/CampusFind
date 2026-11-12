const mongoose = require('mongoose');
const AppError = require('../utils/errors');
const { AuditLog, Category, CampusLocation, ItemReport, Notification } = require('../models');
const cloudinaryService = require('./cloudinary.service');
const { normalizeReportImages } = require('../utils/report');
const matchingService = require('./matching.service');
const notificationService = require('./notification.service');

const publicStatuses = ['published', 'matched', 'claim_pending', 'recovered', 'closed'];
const moderationStatuses = [
  'draft',
  'published',
  'under_review',
  'matched',
  'claim_pending',
  'recovered',
  'closed',
  'rejected',
  'archived'
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertObjectId(value, field) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${field}.`, 400, 'INVALID_IDENTIFIER');
  }
}

async function assertActiveReferences({ category, location }) {
  const [categoryRecord, locationRecord] = await Promise.all([
    Category.findOne({ _id: category, isActive: true }).select('_id').lean(),
    CampusLocation.findOne({ _id: location, isActive: true }).select('_id').lean()
  ]);

  if (!categoryRecord) {
    throw new AppError('Category was not found or is inactive.', 400, 'INVALID_CATEGORY');
  }
  if (!locationRecord) {
    throw new AppError('Campus location was not found or is inactive.', 400, 'INVALID_LOCATION');
  }
}

function validateImages(images = []) {
  for (const image of images) {
    if (!/^https:\/\/res\.cloudinary\.com\//i.test(image.url)) {
      throw new AppError('Images must be hosted by Cloudinary.', 400, 'INVALID_IMAGE_URL');
    }
    if (image.publicId && image.publicId.length > 255) {
      throw new AppError('Image public ID is too long.', 400, 'INVALID_IMAGE');
    }
  }
}

function buildReportData(data, reportType, ownerId) {
  return {
    reportType,
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category,
    location: data.location,
    dateOccurred: new Date(data.dateOccurred),
    approximateTime: data.approximateTime?.trim(),
    currentHoldingLocation: data.currentHoldingLocation?.trim(),
    handlingNotes: data.handlingNotes?.trim(),
    identifyingAttributes: data.identifyingAttributes || {},
    images: normalizeReportImages(data.images),
    ownerId,
    status: 'published'
  };
}

async function createReport(data, reportType, ownerId) {
  await assertActiveReferences(data);
  validateImages(data.images);
  const report = await ItemReport.create(buildReportData(data, reportType, ownerId));
  const matches = await matchingService.getMatchesForReport(report._id, { _id: ownerId }, 10);
  await notificationService.createPotentialMatchNotifications(report._id, ownerId, matches);
  return report;
}

function buildQuery(filters, user) {
  const query = {};
  const mine = filters.mine === 'true';

  if (mine) {
    if (!user) throw new AppError('Authentication is required for your reports.', 401, 'AUTHENTICATION_REQUIRED');
    if (!user.isEmailVerified) {
      throw new AppError('Verify your email address to continue.', 403, 'EMAIL_NOT_VERIFIED');
    }
    query.ownerId = user._id;
    if (filters.status && moderationStatuses.includes(filters.status)) {
      query.status = filters.status;
    }
  } else {
    query.status = filters.status && publicStatuses.includes(filters.status)
      ? filters.status
      : { $in: publicStatuses };
  }

  if (filters.reportType) query.reportType = filters.reportType;
  if (filters.category) query.category = filters.category;
  if (filters.location) query.location = filters.location;

  if (filters.from || filters.to) {
    query.dateOccurred = {};
    if (filters.from) query.dateOccurred.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) query.dateOccurred.$lte = new Date(`${filters.to}T23:59:59.999Z`);
  }

  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search.trim()), 'i');
    query.$or = [
      { title: search },
      { description: search },
      { 'identifyingAttributes.color': search },
      { 'identifyingAttributes.brand': search },
      { 'identifyingAttributes.model': search }
    ];
  }

  return query;
}

async function listReports(filters, user) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 50);
  const sort = filters.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const query = buildQuery(filters, user);
  const [reports, total] = await Promise.all([
    ItemReport.find(query)
      .populate('category', 'name description')
      .populate('location', 'name building description')
      .populate('ownerId', 'name department avatarUrl')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ItemReport.countDocuments(query)
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

async function getReport(reportId, user) {
  assertObjectId(reportId, 'report ID');
  const report = await ItemReport.findById(reportId)
    .populate('category', 'name description')
    .populate('location', 'name building description')
    .populate('ownerId', 'name department avatarUrl')
    .lean();

  if (!report) throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
  const ownerId = report.ownerId?._id || report.ownerId;
  const isOwner = user && ownerId.toString() === user._id.toString();
  const canModerate = user && ['moderator', 'admin'].includes(user.role);
  if (report.status === 'draft' && !isOwner && !canModerate) {
    throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
  }
  return report;
}

async function updateOwnReport(reportId, data, ownerId) {
  assertObjectId(reportId, 'report ID');
  const report = await ItemReport.findOne({ _id: reportId, ownerId });
  if (!report) throw new AppError('Report not found or not owned by you.', 404, 'REPORT_NOT_FOUND');
  if (['recovered', 'closed', 'archived', 'rejected'].includes(report.status)) {
    throw new AppError('This report can no longer be edited.', 409, 'REPORT_NOT_EDITABLE');
  }

  await assertActiveReferences({
    category: data.category || report.category,
    location: data.location || report.location
  });
  validateImages(data.images || []);
  const previousImages = report.images;
  const editableFields = [
    'title',
    'description',
    'category',
    'location',
    'dateOccurred',
    'approximateTime',
    'currentHoldingLocation',
    'handlingNotes',
    'identifyingAttributes',
    'images'
  ];

  for (const field of editableFields) {
    if (data[field] !== undefined) {
      report[field] = field === 'dateOccurred' ? new Date(data[field])
        : field === 'images' ? normalizeReportImages(data[field])
          : typeof data[field] === 'string' ? data[field].trim() : data[field];
    }
  }
  await report.save();

  if (data.images) {
    const retainedIds = new Set(data.images.map((image) => image.publicId).filter(Boolean));
    await cloudinaryService.deleteImages(
      previousImages.filter((image) => image.publicId && !retainedIds.has(image.publicId))
    );
  }

  return report;
}

async function deleteOwnReport(reportId, ownerId) {
  assertObjectId(reportId, 'report ID');
  const report = await ItemReport.findOne({ _id: reportId, ownerId });
  if (!report) throw new AppError('Report not found or not owned by you.', 404, 'REPORT_NOT_FOUND');
  await report.deleteOne();
  await cloudinaryService.deleteImages(report.images);
}

async function changeReportStatus(reportId, status, user, action) {
  assertObjectId(reportId, 'report ID');
  const report = await ItemReport.findById(reportId);
  if (!report) throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');

  const isModerator = ['moderator', 'admin'].includes(user.role);
  const isOwner = report.ownerId.equals(user._id);
  if (!isModerator && !isOwner) {
    throw new AppError('You can only change your own reports.', 403, 'FORBIDDEN');
  }
  if (!isModerator && !['archived', 'recovered'].includes(status)) {
    throw new AppError('You are not allowed to set this report status.', 403, 'FORBIDDEN');
  }

  report.status = status;
  await report.save();
  return report;
}

async function moderateReportStatus(reportId, status, user, reason = '') {
  if (!['moderator', 'admin'].includes(user.role)) {
    throw new AppError('Moderation access is required.', 403, 'FORBIDDEN');
  }
  const report = await ItemReport.findById(reportId);
  if (!report) throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
  const previousStatus = report.status;
  const updatedReport = await changeReportStatus(reportId, status, user, 'moderate');
  await Promise.all([
    AuditLog.create({
      actorId: user._id,
      action: 'report_moderated',
      entityType: 'ItemReport',
      entityId: report._id,
      metadata: { previousStatus, status, reason: reason || null }
    }),
    Notification.create({
      recipientId: report.ownerId,
      type: 'report_status_changed',
      title: 'Report status updated',
      message: `Your report was moved to ${status.replaceAll('_', ' ')}${reason ? `: ${reason}` : '.'}`,
      relatedEntityType: 'ItemReport',
      relatedEntityId: report._id
    })
  ]);
  return updatedReport;
}

async function getReportOptions() {
  const [categories, locations] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    CampusLocation.find({ isActive: true }).sort({ building: 1, name: 1 }).lean()
  ]);
  return { categories, locations };
}

module.exports = {
  createReport,
  listReports,
  getReport,
  updateOwnReport,
  deleteOwnReport,
  changeReportStatus,
  moderateReportStatus,
  getReportOptions,
  publicStatuses,
  moderationStatuses
};

