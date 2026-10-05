import { createMemoryRepository } from '../src/local/memoryRepository.js';
import { createAssignmentsHandler } from '../src/apps/assignments.js';
import { createSubjectsHandler } from '../src/apps/subjects.js';
import { createFilesHandler } from '../src/apps/files.js';
import { silentLogger } from '../src/shared/logger.js';

export const USER_A = 'user-a';
export const USER_B = 'user-b';

// Builds an API Gateway HTTP API (payload v2.0) event like the real one.
export function makeEvent(routeKey, { userId = USER_A, params, body, rawBody } = {}) {
  return {
    routeKey,
    pathParameters: params,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
    isBase64Encoded: false,
    requestContext: userId ? { authorizer: { jwt: { claims: { sub: userId } } } } : {},
  };
}

// In-memory stand-in for S3.
export function createFakeStorage() {
  const objects = new Map();
  return {
    objects,
    async createUpload({ key, contentType }) {
      return { url: 'https://s3.test/upload', fields: { key, 'Content-Type': contentType }, expiresIn: 300 };
    },
    async headObject(key) {
      return objects.has(key) ? { size: objects.get(key) } : null;
    },
    async createDownloadUrl({ key }) {
      return `https://s3.test/download/${encodeURIComponent(key)}`;
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
}

export function createTestApp() {
  let counter = 0;
  const deps = {
    assignments: createMemoryRepository('assignmentId'),
    subjects: createMemoryRepository('subjectId'),
    files: createMemoryRepository('fileId'),
    storage: createFakeStorage(),
    now: () => new Date('2026-10-06T10:00:00.000Z'),
    newId: () => `id-${++counter}`,
    logger: silentLogger,
  };

  const handlers = {
    assignments: createAssignmentsHandler(deps),
    subjects: createSubjectsHandler(deps),
    files: createFilesHandler(deps),
  };

  async function call(name, routeKey, options) {
    const res = await handlers[name](makeEvent(routeKey, options), { awsRequestId: 'test' });
    return { status: res.statusCode, body: JSON.parse(res.body) };
  }

  return { deps, handlers, call };
}
