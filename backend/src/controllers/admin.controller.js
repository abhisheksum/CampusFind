const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const reportService = require('../services/report.service');
const { serializeAdminUser } = require('../utils/admin');
const { serializeReport } = require('../utils/report');

const dashboard = asyncHandler(async (_request, response) => {
  response.json({ success: true, data: await adminService.getDashboard() });
});

const activity = asyncHandler(async (request, response) => {
  response.json({ success: true, data: { activity: await adminService.listActivity(request.query) } });
});

const reports = asyncHandler(async (request, response) => {
  response.json({ success: true, data: await adminService.listReports(request.query) });
});

const users = asyncHandler(async (request, response) => {
  response.json({ success: true, data: await adminService.listUsers(request.query) });
});

const updateUserStatus = asyncHandler(async (request, response) => {
  const user = await adminService.updateUserStatus(request.params.userId, request.body.isActive, request.user);
  response.json({ success: true, data: { user: serializeAdminUser(user) } });
});

const updateUserRole = asyncHandler(async (request, response) => {
  const user = await adminService.updateUserRole(request.params.userId, request.body.role, request.user);
  response.json({ success: true, data: { user: serializeAdminUser(user) } });
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

module.exports = { dashboard, activity, reports, users, updateUserStatus, updateUserRole, moderateReport };
