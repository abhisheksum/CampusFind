const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include'
    });
  } catch (_error) {
    throw new ApiError(
      'Unable to reach the API server. Check that the backend is running and the frontend API URL is correct.',
      0,
      'API_UNREACHABLE'
    );
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message
        || `The API returned an unexpected response (HTTP ${response.status}). Check the backend URL and server status.`,
      response.status,
      body?.error?.code,
      body?.error?.details
    );
  }

  return body;
}

