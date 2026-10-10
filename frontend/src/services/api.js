// HTTP client for the backend API. Every response uses the envelope
// { success, data } / { success: false, error: { code, message } }.
import { config, isDemoMode } from '../config.js';
import { auth } from './auth.js';
import { getDemoBackend } from './demo/demoBackend.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Fired when the session cannot be refreshed; the auth provider listens
// for it and sends the user back to the login page.
export const SESSION_EXPIRED_EVENT = 'scm:session-expired';

function sessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  return new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
}

async function send(method, path, body, token) {
  if (isDemoMode) return getDemoBackend().request(method, path, body, token);

  let res;
  try {
    res = await fetch(config.apiUrl + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your internet connection and try again.');
  }
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

export async function request(method, path, body) {
  let token;
  try {
    token = await auth.getAccessToken();
  } catch {
    throw sessionExpired();
  }

  let res = await send(method, path, body, token);

  // The access token may have been revoked or expired early: refresh once and retry.
  if (res.status === 401 && !isDemoMode) {
    try {
      token = await auth.getAccessToken({ forceRefresh: true });
    } catch {
      throw sessionExpired();
    }
    res = await send(method, path, body, token);
    if (res.status === 401) throw sessionExpired();
  }

  if (res.body?.success) return res.body;
  const error = res.body?.error;
  if (error) throw new ApiError(res.status, error.code, error.message);

  // Responses produced by API Gateway itself (not our Lambdas) have no envelope.
  if (res.status === 429) {
    throw new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many requests. Please wait a moment and try again.');
  }
  throw new ApiError(
    res.status,
    'UNKNOWN_ERROR',
    res.status >= 500 ? 'The server had a problem. Please try again.' : 'Request failed. Please try again.',
  );
}

const data = async (promise) => (await promise).data;

export const assignmentsApi = {
  list: () => data(request('GET', '/assignments')),
  create: (input) => data(request('POST', '/assignments', input)),
  update: (id, changes) => data(request('PUT', `/assignments/${encodeURIComponent(id)}`, changes)),
  remove: (id) => request('DELETE', `/assignments/${encodeURIComponent(id)}`),
};

export const subjectsApi = {
  list: () => data(request('GET', '/subjects')),
  create: (name, color) => data(request('POST', '/subjects', { name, color })),
  remove: (id) => request('DELETE', `/subjects/${encodeURIComponent(id)}`),
};

export const filesApi = {
  list: () => data(request('GET', '/files')),
  requestUpload: (input) => data(request('POST', '/files', input)),
  complete: (id) => data(request('POST', `/files/${encodeURIComponent(id)}/complete`)),
  downloadLink: (id) => data(request('GET', `/files/${encodeURIComponent(id)}/download`)),
  remove: (id) => request('DELETE', `/files/${encodeURIComponent(id)}`),
};
