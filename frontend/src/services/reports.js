import { apiRequest } from './api';

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageSize = 5 * 1024 * 1024;

export async function getReportOptions(request) {
  const response = await request('/reports/options');
  return response.data;
}

export async function getReports(request, filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/reports?${params.toString()}`);
  return response.data;
}

export async function getReport(request, reportId) {
  const response = await request(`/reports/${reportId}`);
  return response.data.report;
}

export async function getMatches(request, options = {}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/matches?${params.toString()}`);
  return response.data.matches;
}

export async function getReportMatches(request, reportId, options = {}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/reports/${reportId}/matches?${params.toString()}`);
  return response.data.matches;
}

export async function getSimilarReports(request, reportId, options = {}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const response = await request(`/reports/${reportId}/similar?${params.toString()}`);
  return response.data.matches;
}

export async function createReport(request, payload) {
  const response = await request('/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data.report;
}

export async function updateReport(request, reportId, payload) {
  const response = await request(`/reports/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  return response.data.report;
}

export async function deleteReport(request, reportId) {
  await request(`/reports/${reportId}`, { method: 'DELETE' });
}

export async function updateReportStatus(request, reportId, action) {
  const response = await request(`/reports/${reportId}/${action}`, { method: 'POST' });
  return response.data.report;
}

export async function uploadReportImages(request, files, onProgress = () => undefined) {
  if (files.some((file) => !allowedImageTypes.includes(file.type))) {
    throw new Error('Only JPG, PNG, and WebP images are supported.');
  }
  if (files.some((file) => file.size > maxImageSize)) {
    throw new Error('Each image must be 5MB or smaller.');
  }

  const signatureResponse = await request('/reports/upload-signature', { method: 'POST' });
  const signature = signatureResponse.data;
  let completed = 0;

  const uploads = files.map((file) => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round(((completed + event.loaded / event.total) / files.length) * 100));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Image upload failed.')));
    xhr.addEventListener('load', () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('Cloudinary rejected the image upload.'));
        return;
      }
      const result = JSON.parse(xhr.responseText);
      completed += 1;
      onProgress(Math.round((completed / files.length) * 100));
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        altText: file.name
      });
    });
    xhr.send(formData);
  }));

  return Promise.all(uploads);
}

export function reportImage(report) {
  return report.images?.[0]?.url || report.image || '';
}

export function reportCategory(report) {
  return typeof report.category === 'object' ? report.category?.name : report.category;
}

export function reportLocation(report) {
  if (typeof report.location === 'object') {
    return [report.location?.name, report.location?.building].filter(Boolean).join(', ');
  }
  return report.location;
}

export function reportDate(report) {
  const date = report.dateOccurred || report.date;
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

