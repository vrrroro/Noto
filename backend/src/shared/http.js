import { AppError, badRequest } from './errors.js';
import { fail } from './response.js';
import { createLogger } from './logger.js';

// The authenticated user's ID comes ONLY from the JWT claims that API Gateway
// verified against Cognito. A userId in the request body or query is never used.
export function getUserId(event) {
  return event?.requestContext?.authorizer?.jwt?.claims?.sub || null;
}

function decodeBody(event) {
  if (!event.body) return undefined;
  if (!event.isBase64Encoded) return event.body;
  const bytes = Uint8Array.from(atob(event.body), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function parseJson(event) {
  const raw = decodeBody(event);
  if (raw === undefined || raw === '') return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw badRequest('INVALID_JSON', 'Request body is not valid JSON.');
  }
}

/**
 * Builds a Lambda handler for an API Gateway HTTP API (payload v2.0).
 * `routes` maps a routeKey such as "GET /assignments/{id}" to an async
 * function receiving { userId, params, body, log }.
 */
export function createHttpHandler({ name, routes, logger = createLogger({ service: name }) }) {
  return async function handler(event, context) {
    const startedAt = Date.now();
    const routeKey = event?.routeKey;
    const log = logger.child({ requestId: context?.awsRequestId, route: routeKey });

    let response;
    try {
      const route = routes[routeKey];
      if (!route) throw new AppError(404, 'ROUTE_NOT_FOUND', 'Route not found.');

      const userId = getUserId(event);
      if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'You must be signed in.');

      let body;
      response = await route({
        userId,
        params: event.pathParameters || {},
        get body() {
          if (body === undefined) body = parseJson(event);
          return body;
        },
        log: log.child({ userId }),
      });
    } catch (err) {
      if (err instanceof AppError) {
        log.warn('Request rejected', { statusCode: err.statusCode, code: err.code });
        response = fail(err.statusCode, err.code, err.message);
      } else {
        // Log the technical details for CloudWatch, but never send them to the user.
        log.error('Unhandled error', { errorName: err?.name, errorMessage: err?.message, stack: err?.stack });
        response = fail(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
      }
    }

    log.info('Request completed', { statusCode: response.statusCode, durationMs: Date.now() - startedAt });
    return response;
  };
}
