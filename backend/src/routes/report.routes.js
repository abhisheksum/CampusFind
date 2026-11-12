const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authenticateOptional = require('../middleware/authenticateOptional');
const authorizeRoles = require('../middleware/authorizeRoles');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const validateRequest = require('../middleware/validateRequest');
const {
  createReport,
  listReports,
  getReport,
  updateReport,
  deleteReport,
  archiveReport,
  resolveReport,
  moderateReport,
  uploadSignature,
  reportOptions
} = require('../controllers/report.controller');
const { getReportMatches } = require('../controllers/matching.controller');
const { listReportClaims } = require('../controllers/claim.controller');
const {
  reportId,
  createReportValidators,
  updateReportValidators,
  listReportValidators,
  moderationValidators
} = require('../validators/report.validators');
const { reportMatchesValidators } = require('../validators/matching.validators');
const { reportClaimsValidators } = require('../validators/claim.validators');

const router = express.Router();

router.get('/options', reportOptions);
router.get('/:reportId/matches', reportMatchesValidators, validateRequest, authenticateUser, requireVerifiedEmail, getReportMatches);
router.get('/:reportId/similar', reportMatchesValidators, validateRequest, authenticateUser, requireVerifiedEmail, getReportMatches);
router.get('/:reportId/claims', reportClaimsValidators, validateRequest, authenticateUser, requireVerifiedEmail, listReportClaims);
router.get('/', listReportValidators, validateRequest, authenticateOptional, listReports);
router.get('/:reportId', reportId, validateRequest, authenticateOptional, getReport);

router.use(authenticateUser, requireVerifiedEmail);
router.post('/upload-signature', uploadSignature);
router.post('/', authorizeRoles('student'), createReportValidators, validateRequest, (request, response, next) => {
  if (!['lost', 'found'].includes(request.body.reportType)) return next();
  return createReport(request.body.reportType)(request, response, next);
});
router.patch('/:reportId', updateReportValidators, validateRequest, updateReport);
router.delete('/:reportId', reportId, validateRequest, deleteReport);
router.post('/:reportId/archive', reportId, validateRequest, archiveReport);
router.post('/:reportId/resolve', reportId, validateRequest, resolveReport);
router.patch(
  '/:reportId/status',
  authorizeRoles('moderator', 'admin'),
  moderationValidators,
  validateRequest,
  moderateReport
);

module.exports = router;

