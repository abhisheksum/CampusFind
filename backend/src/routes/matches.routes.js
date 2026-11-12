const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const requireVerifiedEmail = require('../middleware/requireVerifiedEmail');
const validateRequest = require('../middleware/validateRequest');
const { getMatches } = require('../controllers/matching.controller');
const { matchesQueryValidators } = require('../validators/matching.validators');

const router = express.Router();

router.use(authenticateUser, requireVerifiedEmail);
router.get('/', matchesQueryValidators, validateRequest, getMatches);

module.exports = router;
