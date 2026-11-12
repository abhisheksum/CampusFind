const asyncHandler = require('../utils/asyncHandler');
const matchingService = require('../services/matching.service');

const getMatches = asyncHandler(async (request, response) => {
  const matches = request.query.reportId
    ? await matchingService.getMatchesForReport(request.query.reportId, request.user, request.query.limit)
    : await matchingService.getMatchesForUser(request.user, request.query.limit);

  response.json({ success: true, data: { matches } });
});

const getReportMatches = asyncHandler(async (request, response) => {
  const matches = await matchingService.getMatchesForReport(
    request.params.reportId,
    request.user,
    request.query.limit
  );
  response.json({ success: true, data: { matches } });
});

module.exports = { getMatches, getReportMatches };
