export async function getAdminDashboard(request) {
  const response = await request('/admin/dashboard');
  return response.data;
}

export async function getAdminActivity(request, filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await request(`/admin/activity?${params.toString()}`);
  return response.data.activity;
}

export async function getAdminReports(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/admin/reports?${params.toString()}`);
  return response.data;
}

export async function moderateReport(request, reportId, status, reason) {
  const response = await request(`/admin/reports/${reportId}/moderate`, {
    method: 'POST',
    body: JSON.stringify({ status, reason })
  });
  return response.data.report;
}

export async function getAdminUsers(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/admin/users?${params.toString()}`);
  return response.data;
}

export async function updateUserStatus(request, userId, isActive) {
  const response = await request(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
  return response.data.user;
}

export async function updateUserRole(request, userId, role) {
  const response = await request(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
  return response.data.user;
}
