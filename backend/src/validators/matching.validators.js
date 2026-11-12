const { param, query } = require('express-validator');

const reportId = param('reportId').isMongoId().withMessage('Report ID is invalid.');

const matchesQueryValidators = [
  query('reportId').optional().isMongoId().withMessage('Report ID is invalid.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50.')
];

const reportMatchesValidators = [
  reportId,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50.')
];

module.exports = { matchesQueryValidators, reportMatchesValidators };
