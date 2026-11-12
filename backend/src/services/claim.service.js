const mongoose = require('mongoose');
const AppError = require('../utils/errors');
const { AuditLog, ItemReport, Notification, RecoveryClaim } = require('../models');
const { normalizeClaimImages } = require('../utils/claim');

const claimableReportStatuses = ['published', 'under_review', 'matched', 'claim_pending'];
const reviewableClaimStatuses = ['submitted', 'under_review', 'more_information_required'];
const transitions = {
  submitted: ['under_review', 'more_information_required', 'accepted', 'rejected'],
  under_review: ['more_information_required', 'accepted', 'rejected'],
  more_information_required: ['under_review', 'accepted', 'rejected']
};
const terminalReportStatuses = ['recovered', 'closed', 'archived', 'rejected'];

function assertObjectId(value, field) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${field}.`, 400, 'INVALID_IDENTIFIER');
  }
}

function validateEvidenceImages(images = []) {
  if (!Array.isArray(images) || images.length > 5) {
    throw new AppError('A claim can have at most 5 evidence images.', 400, 'INVALID_EVIDENCE');
  }
  for (const image of images) {
    if (typeof image !== 'string' || !/^https:\/\/res\.cloudinary\.com\//i.test(image)) {
      throw new AppError('Evidence images must be secure Cloudinary URLs.', 400, 'INVALID_EVIDENCE');
    }
  }
}

function assertTransition(status, nextStatus) {
  if (!reviewableClaimStatuses.includes(status) || !transitions[status].includes(nextStatus)) {
    throw new AppError(`A claim cannot transition from ${status} to ${nextStatus}.`, 409, 'INVALID_CLAIM_TRANSITION');
  }
}

function isModerator(user) {
  return ['moderator', 'admin'].includes(user.role);
}

function isSameId(left, right) {
  return left && right && left.toString() === right.toString();
}

function assertReviewAccess(claim, user) {
  const reportOwnerId = claim.reportId.ownerId?._id || claim.reportId.ownerId;
  const claimantId = claim.claimantId?._id || claim.claimantId;
  const canReview = isModerator(user) || isSameId(reportOwnerId, user._id);
  if (!canReview) {
    throw new AppError('Only the finder or a moderator can review this claim.', 403, 'FORBIDDEN');
  }
  if (isSameId(claimantId, user._id)) {
    throw new AppError('Claimants cannot review their own claims.', 403, 'FORBIDDEN');
  }
}

async function loadClaim(claimId, populate = true) {
  assertObjectId(claimId, 'claim ID');
  let query = RecoveryClaim.findById(claimId);
  if (populate) {
    query = query
      .populate({
        path: 'reportId',
        select: 'title reportType status ownerId images category location dateOccurred'
      })
      .populate('claimantId', 'name avatarUrl')
      .populate('reviewedBy', 'name');
  }
  const claim = await query;
  if (!claim) throw new AppError('Claim not found.', 404, 'CLAIM_NOT_FOUND');
  return claim;
}

async function createClaim(data, claimantId) {
  assertObjectId(data.reportId, 'report ID');
  const report = await ItemReport.findOne({
    _id: data.reportId,
    reportType: 'found'
  }).select('ownerId reportType status title');

  if (!report) throw new AppError('Only existing found reports can be claimed.', 404, 'REPORT_NOT_FOUND');
  if (isSameId(report.ownerId, claimantId)) {
    throw new AppError('You cannot claim your own found report.', 403, 'SELF_CLAIM_NOT_ALLOWED');
  }
  if (!claimableReportStatuses.includes(report.status) || terminalReportStatuses.includes(report.status)) {
    throw new AppError('This report is no longer available for claims.', 409, 'REPORT_NOT_CLAIMABLE');
  }

  validateEvidenceImages(data.evidenceImages || []);
  const existingClaim = await RecoveryClaim.findOne({
    reportId: report._id,
    claimantId,
    status: { $in: reviewableClaimStatuses }
  }).select('_id');
  if (existingClaim) {
    throw new AppError('You already have an active claim for this report.', 409, 'DUPLICATE_CLAIM');
  }

  let claim;
  try {
    claim = await RecoveryClaim.create({
      reportId: report._id,
      claimantId,
      message: data.message.trim(),
      evidenceImages: normalizeClaimImages(data.evidenceImages || [])
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('You already have an active claim for this report.', 409, 'DUPLICATE_CLAIM');
    }
    throw error;
  }

  const updatedReport = await ItemReport.findOneAndUpdate(
    { _id: report._id, status: { $in: claimableReportStatuses } },
    { $set: { status: 'claim_pending' } },
    { new: true }
  );
  if (!updatedReport) {
    await RecoveryClaim.deleteOne({ _id: claim._id });
    throw new AppError('The report is no longer available for claims.', 409, 'REPORT_NOT_CLAIMABLE');
  }

  await Promise.all([
    AuditLog.create({
      actorId: claimantId,
      action: 'claim_submitted',
      entityType: 'RecoveryClaim',
      entityId: claim._id,
      metadata: { reportId: report._id }
    }),
    Notification.create({
      recipientId: report.ownerId,
      type: 'new_claim',
      title: 'New recovery claim',
      message: 'A student submitted a claim for your found item.',
      relatedEntityType: 'RecoveryClaim',
      relatedEntityId: claim._id
    })
  ]);

  return loadClaim(claim._id);
}

function claimAccessQuery(claim, user) {
  const reportOwnerId = claim.reportId.ownerId?._id || claim.reportId.ownerId;
  const claimantId = claim.claimantId?._id || claim.claimantId;
  return isModerator(user) || isSameId(reportOwnerId, user._id) || isSameId(claimantId, user._id);
}

async function getClaim(claimId, user) {
  const claim = await loadClaim(claimId);
  if (!claimAccessQuery(claim, user)) {
    throw new AppError('You are not allowed to view this claim.', 403, 'FORBIDDEN');
  }
  return claim;
}

async function listMyClaims(user, filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 50);
  const query = { claimantId: user._id };
  if (filters.status) query.status = filters.status;
  const [claims, total] = await Promise.all([
    RecoveryClaim.find(query)
      .populate('reportId', 'title reportType status images ownerId')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    RecoveryClaim.countDocuments(query)
  ]);
  return { claims, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function listReportClaims(reportId, user, filters = {}) {
  assertObjectId(reportId, 'report ID');
  const report = await ItemReport.findById(reportId).select('ownerId');
  if (!report) throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
  if (!isModerator(user) && !isSameId(report.ownerId, user._id)) {
    throw new AppError('Only the finder or a moderator can view these claims.', 403, 'FORBIDDEN');
  }

  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 50);
  const query = { reportId };
  if (filters.status) query.status = filters.status;
  const [claims, total] = await Promise.all([
    RecoveryClaim.find(query)
      .populate('claimantId', 'name avatarUrl department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    RecoveryClaim.countDocuments(query)
  ]);
  return { claims, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function listAllClaims(user, filters = {}) {
  if (!isModerator(user)) {
    throw new AppError('Moderation access is required.', 403, 'FORBIDDEN');
  }
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.min(Math.max(Number(filters.limit) || 12, 1), 50);
  const query = {};
  if (filters.status) query.status = filters.status;
  const [claims, total] = await Promise.all([
    RecoveryClaim.find(query)
      .populate('reportId', 'title reportType status images ownerId')
      .populate('claimantId', 'name avatarUrl department')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    RecoveryClaim.countDocuments(query)
  ]);
  return { claims, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function updateClaim(claimId, data, user) {
  const claim = await loadClaim(claimId);
  if (!isSameId(claim.claimantId._id || claim.claimantId, user._id)) {
    throw new AppError('Only the claimant can update this claim.', 403, 'FORBIDDEN');
  }
  if (claim.status !== 'more_information_required') {
    throw new AppError('Only claims requesting more information can be updated.', 409, 'CLAIM_NOT_EDITABLE');
  }
  validateEvidenceImages(data.evidenceImages || claim.evidenceImages);
  if (data.message !== undefined) claim.message = data.message.trim();
  if (data.evidenceImages !== undefined) claim.evidenceImages = normalizeClaimImages(data.evidenceImages);
  claim.status = 'under_review';
  claim.reviewedBy = null;
  claim.reviewedAt = null;
  claim.decisionReason = null;
  claim.reviewNotes = null;
  await claim.save();

  await Promise.all([
    AuditLog.create({
      actorId: user._id,
      action: 'claim_information_updated',
      entityType: 'RecoveryClaim',
      entityId: claim._id,
      metadata: { reportId: claim.reportId._id || claim.reportId }
    }),
    Notification.create({
      recipientId: claim.reportId.ownerId?._id || claim.reportId.ownerId,
      type: 'claim_status_changed',
      title: 'Claim information updated',
      message: 'A claimant provided the additional information requested.',
      relatedEntityType: 'RecoveryClaim',
      relatedEntityId: claim._id
    })
  ]);
  return loadClaim(claim._id);
}

async function loadReviewClaim(claimId, user, session) {
  assertObjectId(claimId, 'claim ID');
  const query = RecoveryClaim.findById(claimId)
    .populate('reportId', 'title reportType status ownerId')
    .populate('claimantId', 'name avatarUrl');
  if (session) query.session(session);
  const claim = await query;
  if (!claim) throw new AppError('Claim not found.', 404, 'CLAIM_NOT_FOUND');
  assertReviewAccess(claim, user);
  return claim;
}

function transactionUnavailable(error) {
  return [20, 251, 263].includes(error.code)
    || /transaction|replica set|mongos/i.test(error.message || '');
}

async function approveWithSession(claimId, user, reason, session) {
  const context = await loadReviewClaim(claimId, user, session);
  assertTransition(context.status, 'accepted');
  const reviewedAt = new Date();
  const acceptedClaim = await RecoveryClaim.findOneAndUpdate(
    { _id: context._id, status: { $in: reviewableClaimStatuses } },
    { $set: { status: 'accepted', reviewedBy: user._id, reviewedAt, decisionReason: reason, reviewNotes: reason } },
    { new: true, session }
  );
  if (!acceptedClaim) throw new AppError('This claim was already reviewed.', 409, 'CLAIM_ALREADY_REVIEWED');

  const report = await ItemReport.findOneAndUpdate(
    { _id: context.reportId._id, status: { $in: claimableReportStatuses } },
    { $set: { status: 'recovered', recoveredAt: reviewedAt, recoveryClaimId: acceptedClaim._id } },
    { new: true, session }
  );
  if (!report) throw new AppError('The report has already been recovered or closed.', 409, 'REPORT_ALREADY_RESOLVED');

  await RecoveryClaim.updateMany(
    { reportId: context.reportId._id, _id: { $ne: acceptedClaim._id }, status: { $in: reviewableClaimStatuses } },
    { $set: { status: 'rejected', reviewedBy: user._id, reviewedAt, decisionReason: 'Another claim was approved.', reviewNotes: 'Another claim was approved.' } },
    { session }
  );
  await AuditLog.create([{
    actorId: user._id,
    action: 'claim_approved',
    entityType: 'RecoveryClaim',
    entityId: acceptedClaim._id,
    metadata: { reportId: context.reportId._id, reason }
  }], { session });
  await Notification.create([{
    recipientId: acceptedClaim.claimantId,
    type: 'claim_status_changed',
    title: 'Claim approved',
    message: 'Your claim was approved and the report is marked as recovered.',
    relatedEntityType: 'RecoveryClaim',
    relatedEntityId: acceptedClaim._id
  }], { session });
}

async function approveWithoutTransaction(claimId, user, reason) {
  const context = await loadReviewClaim(claimId, user);
  assertTransition(context.status, 'accepted');
  const previousStatus = context.status;
  const reviewedAt = new Date();
  const acceptedClaim = await RecoveryClaim.findOneAndUpdate(
    { _id: context._id, status: { $in: reviewableClaimStatuses } },
    { $set: { status: 'accepted', reviewedBy: user._id, reviewedAt, decisionReason: reason, reviewNotes: reason } },
    { new: true }
  );
  if (!acceptedClaim) throw new AppError('This claim was already reviewed.', 409, 'CLAIM_ALREADY_REVIEWED');

  const report = await ItemReport.findOneAndUpdate(
    { _id: context.reportId._id, status: { $in: claimableReportStatuses } },
    { $set: { status: 'recovered', recoveredAt: reviewedAt, recoveryClaimId: acceptedClaim._id } },
    { new: true }
  );
  if (!report) {
    await RecoveryClaim.updateOne(
      { _id: acceptedClaim._id, status: 'accepted', reviewedBy: user._id },
      { $set: { status: previousStatus }, $unset: { reviewedBy: 1, reviewedAt: 1, decisionReason: 1, reviewNotes: 1 } }
    );
    throw new AppError('The report has already been recovered or closed.', 409, 'REPORT_ALREADY_RESOLVED');
  }

  await RecoveryClaim.updateMany(
    { reportId: context.reportId._id, _id: { $ne: acceptedClaim._id }, status: { $in: reviewableClaimStatuses } },
    { $set: { status: 'rejected', reviewedBy: user._id, reviewedAt, decisionReason: 'Another claim was approved.', reviewNotes: 'Another claim was approved.' } }
  );
  await AuditLog.create({
    actorId: user._id,
    action: 'claim_approved',
    entityType: 'RecoveryClaim',
    entityId: acceptedClaim._id,
    metadata: { reportId: context.reportId._id, reason, transactionFallback: true }
  });
  await Notification.create({
    recipientId: acceptedClaim.claimantId,
    type: 'claim_status_changed',
    title: 'Claim approved',
    message: 'Your claim was approved and the report is marked as recovered.',
    relatedEntityType: 'RecoveryClaim',
    relatedEntityId: acceptedClaim._id
  });
}

async function approveClaim(claimId, user, reason) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => approveWithSession(claimId, user, reason, session));
  } catch (error) {
    if (!transactionUnavailable(error)) throw error;
    await approveWithoutTransaction(claimId, user, reason);
  } finally {
    await session.endSession();
  }
  return loadClaim(claimId);
}

async function reviewClaim(claimId, user, nextStatus, reason) {
  const claim = await loadReviewClaim(claimId, user);
  assertTransition(claim.status, nextStatus);
  const reviewedAt = new Date();
  const updated = await RecoveryClaim.findOneAndUpdate(
    { _id: claim._id, status: claim.status },
    { $set: { status: nextStatus, reviewedBy: user._id, reviewedAt, decisionReason: reason, reviewNotes: reason } },
    { new: true }
  );
  if (!updated) throw new AppError('This claim was already reviewed.', 409, 'CLAIM_ALREADY_REVIEWED');

  await Promise.all([
    AuditLog.create({
      actorId: user._id,
      action: `claim_${nextStatus}`,
      entityType: 'RecoveryClaim',
      entityId: claim._id,
      metadata: { reportId: claim.reportId._id, reason }
    }),
    Notification.create({
      recipientId: claim.claimantId._id || claim.claimantId,
      type: 'claim_status_changed',
      title: nextStatus === 'rejected' ? 'Claim rejected' : 'More information requested',
      message: nextStatus === 'rejected'
        ? 'Your recovery claim was rejected.'
        : 'The reviewer requested more information for your recovery claim.',
      relatedEntityType: 'RecoveryClaim',
      relatedEntityId: claim._id
    })
  ]);
  return loadClaim(claim._id);
}

module.exports = {
  createClaim,
  getClaim,
  listMyClaims,
  listReportClaims,
  listAllClaims,
  updateClaim,
  approveClaim,
  reviewClaim,
  reviewableClaimStatuses
};
