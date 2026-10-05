// Every Lambda returns the same JSON envelope:
//   success: { "success": true, "data": ... }
//   failure: { "success": false, "error": { "code": "...", "message": "..." } }

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function ok(data, statusCode = 200, extra = {}) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({ success: true, data, ...extra }),
  };
}

export function created(data) {
  return ok(data, 201);
}

export function fail(statusCode, code, message) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify({ success: false, error: { code, message } }),
  };
}
