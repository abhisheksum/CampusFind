const asyncHandler = require('../utils/asyncHandler');
const claimService = require('../services/claim.service');
const { serializeClaim } = require('../utils/claim');

const createClaim = asyncHandler(async (request, response) => {
  const claim = await claimService.createClaim(request.body, request.user._id);
  response.status(201).json({ success: true, data: { claim: serializeClaim(claim) } });
});

const listMyClaims = asyncHandler(async (request, response) => {
  const result = await claimService.listMyClaims(request.user, request.query);
  response.json({
    success: true,
    data: { claims: result.claims.map(serializeClaim), pagination: result.pagination }
  });
});

const getClaim = asyncHandler(async (request, response) => {
  const claim = await claimService.getClaim(request.params.claimId, request.user);
  response.json({ success: true, data: { claim: serializeClaim(claim) } });
});

const listReportClaims = asyncHandler(async (request, response) => {
  const result = await claimService.listReportClaims(request.params.reportId, request.user, request.query);
  response.json({
    success: true,
    data: { claims: result.claims.map(serializeClaim), pagination: result.pagination }
  });
});

const listAllClaims = asyncHandler(async (request, response) => {
  const result = await claimService.listAllClaims(request.user, request.query);
  response.json({
    success: true,
    data: { claims: result.claims.map(serializeClaim), pagination: result.pagination }
  });
});

const updateClaim = asyncHandler(async (request, response) => {
  const claim = await claimService.updateClaim(request.params.claimId, request.body, request.user);
  response.json({ success: true, data: { claim: serializeClaim(claim) } });
});

const approveClaim = asyncHandler(async (request, response) => {
  const claim = await claimService.approveClaim(request.params.claimId, request.user, request.body.reason.trim());
  response.json({ success: true, data: { claim: serializeClaim(claim) } });
});

const rejectClaim = asyncHandler(async (request, response) => {
  const claim = await claimService.reviewClaim(request.params.claimId, request.user, 'rejected', request.body.reason.trim());
  response.json({ success: true, data: { claim: serializeClaim(claim) } });
});

const requestInformation = asyncHandler(async (request, response) => {
  const claim = await claimService.reviewClaim(
    request.params.claimId,
    request.user,
    'more_information_required',
    request.body.reason.trim()
  );
  response.json({ success: true, data: { claim: serializeClaim(claim) } });
});

module.exports = {
  createClaim,
  listMyClaims,
  getClaim,
  listReportClaims,
  listAllClaims,
  updateClaim,
  approveClaim,
  rejectClaim,
  requestInformation
};
