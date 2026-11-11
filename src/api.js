import { API_BASE_URL } from './config';

// Error with the API's message and HTTP status, so pages can show it directly.
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// JSON fetch with the session cookie. Returns the response's `data` (or the whole body if none).
export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, {
      method,
      credentials: 'include',
      headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  const json = await response.json().catch(() => null);
  if (!response.ok || !json || json.success === false) {
    throw new ApiError(json?.message || `Request failed (${response.status})`, response.status, json?.errors);
  }
  return 'data' in json ? json.data : json;
}
