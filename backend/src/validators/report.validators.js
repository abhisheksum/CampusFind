const { body, param, query } = require('express-validator');

const reportId = param('reportId').isMongoId().withMessage('Report ID is invalid.');
const reportType = body('reportType').isIn(['lost', 'found']).withMessage('Report type must be lost or found.');
const commonFields = [
  body('title').trim().isLength({ min: 3, max: 160 }).withMessage('Title must be 3-160 characters.'),
  body('description').trim().isLength({ min: 10, max: 4000 }).withMessage('Description must be 10-4000 characters.'),
  body('category').isMongoId().withMessage('Category is invalid.'),
  body('location').isMongoId().withMessage('Campus location is invalid.'),
  body('dateOccurred').isISO8601().withMessage('Date occurred must be a valid date.'),
  body('approximateTime').optional({ values: 'falsy' }).trim().isLength({ max: 40 }).withMessage('Approximate time is too long.'),
  body('currentHoldingLocation').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Holding location is too long.'),
  body('handlingNotes').optional({ values: 'falsy' }).trim().isLength({ max: 1200 }).withMessage('Handling notes are too long.'),
  body('identifyingAttributes').optional().isObject().withMessage('Identifying attributes must be an object.'),
  body('images').optional().isArray({ max: 5 }).withMessage('A report can have at most 5 images.'),
  body('images.*.url').optional().isURL({ protocols: ['https'] }).withMessage('Image URL must be HTTPS.'),
  body('images.*.publicId').optional().isString().trim().isLength({ max: 255 }).withMessage('Image public ID is invalid.'),
  body('images.*.altText').optional().isString().trim().isLength({ max: 160 }).withMessage('Image alt text is invalid.')
];

const createReportValidators = [reportType, ...commonFields];
const updateReportValidators = [
  ...commonFields.map((validator) => validator.optional()),
  body('reportType').not().exists().withMessage('Report type cannot be changed.'),
  body('status').not().exists().withMessage('Status cannot be changed here.')
];

const listReportValidators = [
  query('reportType').optional().isIn(['lost', 'found']).withMessage('Report type is invalid.'),
  query('category').optional().isMongoId().withMessage('Category is invalid.'),
  query('location').optional().isMongoId().withMessage('Location is invalid.'),
  query('status').optional().isIn([
    'published',
    'matched',
    'claim_pending',
    'recovered',
    'closed'
  ]).withMessage('Status is invalid.'),
  query('from').optional().isISO8601().withMessage('From date is invalid.'),
  query('to').optional().isISO8601().withMessage('To date is invalid.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50.'),
  query('sort').optional().isIn(['newest', 'oldest']).withMessage('Sort must be newest or oldest.'),
  query('mine').optional().isBoolean().withMessage('Mine must be boolean.')
];

const moderationValidators = [
  reportId,
  body('status').isIn([
    'draft',
    'published',
    'under_review',
    'matched',
    'claim_pending',
    'recovered',
    'closed',
    'rejected',
    'archived'
  ]).withMessage('Moderation status is invalid.'),
  body('reason').optional().trim().isLength({ max: 2000 }).withMessage('Moderation reason cannot exceed 2000 characters.')
];

module.exports = {
  reportId,
  createReportValidators,
  updateReportValidators,
  listReportValidators,
  moderationValidators
};

