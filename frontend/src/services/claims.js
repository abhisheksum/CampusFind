import { uploadReportImages } from './reports';

export async function createClaim(request, payload) {
  const response = await request('/claims', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data.claim;
}

export async function getMyClaims(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/claims/my?${params.toString()}`);
  return response.data;
}

export async function getClaim(request, claimId) {
  const response = await request(`/claims/${claimId}`);
  return response.data.claim;
}

export async function getReportClaims(request, reportId, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/reports/${reportId}/claims?${params.toString()}`);
  return response.data;
}

export async function getAllClaims(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/claims?${params.toString()}`);
  return response.data;
}

export async function updateClaim(request, claimId, payload) {
  const response = await request(`/claims/${claimId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return response.data.claim;
}

export async function reviewClaim(request, claimId, action, reason) {
  const response = await request(`/claims/${claimId}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  return response.data.claim;
}

export { uploadReportImages };
