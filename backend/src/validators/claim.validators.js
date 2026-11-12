const { body, param, query } = require('express-validator');

const claimId = param('claimId').isMongoId().withMessage('Claim ID is invalid.');
const reportId = param('reportId').isMongoId().withMessage('Report ID is invalid.');
const status = query('status').optional().isIn([
  'submitted',
  'under_review',
  'more_information_required',
  'accepted',
  'rejected'
]).withMessage('Claim status is invalid.');
const pagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50.')
];
const evidenceImages = body('evidenceImages.*')
  .custom((value) => /^https:\/\/res\.cloudinary\.com\//i.test(value))
  .withMessage('Evidence images must be secure Cloudinary URLs.');

const createClaimValidators = [
  body('reportId').isMongoId().withMessage('Report ID is invalid.'),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Claim explanation must be 10-3000 characters.'),
  body('evidenceImages').optional().isArray({ max: 5 }).withMessage('A claim can have at most 5 evidence images.'),
  evidenceImages
];

const updateClaimValidators = [
  claimId,
  body('message').optional().trim().isLength({ min: 10, max: 3000 }).withMessage('Claim explanation must be 10-3000 characters.'),
  body('evidenceImages').optional().isArray({ max: 5 }).withMessage('A claim can have at most 5 evidence images.'),
  evidenceImages
];

const decisionValidators = [
  claimId,
  body('reason').trim().isLength({ min: 3, max: 2000 }).withMessage('A decision reason must be 3-2000 characters.')
];

const listClaimsValidators = [...pagination, status];
const reportClaimsValidators = [reportId, ...pagination, status];

module.exports = {
  claimId,
  createClaimValidators,
  updateClaimValidators,
  decisionValidators,
  listClaimsValidators,
  reportClaimsValidators
};
