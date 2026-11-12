const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateRequest = require('../middleware/validateRequest');
const {
  createClaim,
  listMyClaims,
  listAllClaims,
  getClaim,
  updateClaim,
  approveClaim,
  rejectClaim,
  requestInformation
} = require('../controllers/claim.controller');
const {
  claimId,
  createClaimValidators,
  updateClaimValidators,
  decisionValidators,
  listClaimsValidators
} = require('../validators/claim.validators');

const router = express.Router();

router.use(authenticateUser, requireVerifiedEmail);
router.post('/', createClaimValidators, validateRequest, createClaim);
router.get('/', authorizeRoles('moderator', 'admin'), listClaimsValidators, validateRequest, listAllClaims);
router.get('/my', listClaimsValidators, validateRequest, listMyClaims);
router.get('/:claimId', claimId, validateRequest, getClaim);
router.patch('/:claimId', updateClaimValidators, validateRequest, updateClaim);
router.post('/:claimId/approve', decisionValidators, validateRequest, approveClaim);
router.post('/:claimId/reject', decisionValidators, validateRequest, rejectClaim);
router.post('/:claimId/request-information', decisionValidators, validateRequest, requestInformation);

module.exports = router;
