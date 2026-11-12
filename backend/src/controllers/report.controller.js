const asyncHandler = require('../utils/asyncHandler');
const cloudinaryService = require('../services/cloudinary.service');
const reportService = require('../services/report.service');
const { serializeReport } = require('../utils/report');

const createReport = (reportType) => asyncHandler(async (request, response) => {
  const report = await reportService.createReport(request.body, reportType, request.user._id);
  response.status(201).json({ success: true, data: { report: serializeReport(report) } });
});

const listReports = asyncHandler(async (request, response) => {
  const result = await reportService.listReports(request.query, request.user);
  response.json({
    success: true,
    data: {
      reports: result.reports.map(serializeReport),
      pagination: result.pagination
    }
  });
});

const getReport = asyncHandler(async (request, response) => {
  const report = await reportService.getReport(request.params.reportId, request.user);
  response.json({ success: true, data: { report: serializeReport(report) } });
});

const updateReport = asyncHandler(async (request, response) => {
  const report = await reportService.updateOwnReport(
    request.params.reportId,
    request.body,
    request.user._id
  );
  response.json({ success: true, data: { report: serializeReport(report) } });
});

const deleteReport = asyncHandler(async (request, response) => {
  await reportService.deleteOwnReport(request.params.reportId, request.user._id);
  response.status(204).send();
});

const archiveReport = asyncHandler(async (request, response) => {
  const report = await reportService.changeReportStatus(
    request.params.reportId,
    'archived',
    request.user,
    'archive'
  );
  response.json({ success: true, data: { report: serializeReport(report) } });
});

const resolveReport = asyncHandler(async (request, response) => {
  const report = await reportService.changeReportStatus(
    request.params.reportId,
    'recovered',
    request.user,
    'resolve'
  );
  response.json({ success: true, data: { report: serializeReport(report) } });
});

const moderateReport = asyncHandler(async (request, response) => {
  const report = await reportService.moderateReportStatus(
    request.params.reportId,
    request.body.status,
    request.user,
    request.body.reason
  );
  response.json({ success: true, data: { report: serializeReport(report) } });
});

const uploadSignature = asyncHandler(async (_request, response) => {
  response.json({ success: true, data: cloudinaryService.createUploadSignature() });
});

const reportOptions = asyncHandler(async (_request, response) => {
  response.json({ success: true, data: await reportService.getReportOptions() });
});

module.exports = {
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
};

