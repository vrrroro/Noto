// Demo mode backend. It runs the REAL Lambda route handlers from
// backend/src/apps in the browser, swapping DynamoDB for localStorage and
// S3 for IndexedDB. Validation, ownership checks and error formats are
// therefore identical to the deployed AWS API.
import { createAssignmentsHandler } from '@backend/apps/assignments.js';
import { createSubjectsHandler } from '@backend/apps/subjects.js';
import { createFilesHandler } from '@backend/apps/files.js';
import { createMemoryRepository } from '@backend/local/memoryRepository.js';
import { silentLogger } from '@backend/shared/logger.js';
import { indexedDbBlobStore } from './blobStore.js';
import { addDays, todayString } from '../../utils/date.js';

export const DEMO_TOKEN_PREFIX = 'demo-token:';

// Same routes as the HTTP API in infrastructure/template.yaml.
const ROUTES = [
  '/assignments',
  '/assignments/{id}',
  '/subjects',
  '/subjects/{id}',
  '/files',
  '/files/{id}',
  '/files/{id}/complete',
  '/files/{id}/download',
];

function matchRoute(path) {
  const parts = path.split('?')[0].split('/').filter(Boolean);
  for (const pattern of ROUTES) {
    const patternParts = pattern.split('/').filter(Boolean);
    if (patternParts.length !== parts.length) continue;
    const params = {};
    const matches = patternParts.every((segment, i) => {
      if (segment === '{id}') {
        params.id = decodeURIComponent(parts[i]);
        return true;
      }
      return segment === parts[i];
    });
    if (matches) return { pattern, params, service: patternParts[0] };
  }
  return null;
}

function persistentRepository(idKey, key, area) {
  let initial = {};
  try {
    initial = JSON.parse(area.getItem(key) || '{}');
  } catch {
    initial = {};
  }
  return createMemoryRepository(idKey, {
    initial,
    onChange: (state) => area.setItem(key, JSON.stringify(state)),
  });
}

export function createDemoBackend({ storageArea, blobs, latencyMs = 0 }) {
  const repos = {
    assignments: persistentRepository('assignmentId', 'scm.demo.assignments', storageArea),
    subjects: persistentRepository('subjectId', 'scm.demo.subjects', storageArea),
    files: persistentRepository('fileId', 'scm.demo.files', storageArea),
  };

  const storage = {
    createUpload: async ({ key, contentType }) => ({
      url: 'demo://upload',
      fields: { key, 'Content-Type': contentType },
      expiresIn: 300,
    }),
    headObject: async (key) => {
      const blob = await blobs.get(key);
      return blob ? { size: blob.size } : null;
    },
    createDownloadUrl: async ({ key }) => `demo://download/${encodeURIComponent(key)}`,
    deleteObject: (key) => blobs.delete(key),
  };

  const deps = { ...repos, storage, logger: silentLogger };
  const handlers = {
    assignments: createAssignmentsHandler(deps),
    subjects: createSubjectsHandler(deps),
    files: createFilesHandler(deps),
  };

  async function handle(method, path, body, token) {
    const route = matchRoute(path);
    if (!route) return { status: 404, body: { success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found.' } } };

    // Mimics the API Gateway JWT authorizer: identity comes from the token only.
    const userId = token?.startsWith(DEMO_TOKEN_PREFIX) ? token.slice(DEMO_TOKEN_PREFIX.length) : null;
    const event = {
      routeKey: `${method} ${route.pattern}`,
      pathParameters: route.params,
      body: body === undefined ? undefined : JSON.stringify(body),
      requestContext: userId ? { authorizer: { jwt: { claims: { sub: userId } } } } : {},
    };
    const res = await handlers[route.service](event, { awsRequestId: `demo-${Date.now()}` });
    return { status: res.statusCode, body: JSON.parse(res.body) };
  }

  // Simulated network latency so loading states are visible in demos.
  async function request(...args) {
    if (latencyMs) await new Promise((r) => setTimeout(r, latencyMs));
    return handle(...args);
  }

  // Uploads a blob through the same request -> upload -> confirm flow as AWS.
  async function uploadBlob(token, { fileName, blob, subject }) {
    const start = await handle('POST', '/files', { fileName, fileSize: blob.size, subject }, token);
    if (!start.body.success) throw new Error(start.body.error.message);
    await blobs.put(start.body.data.upload.fields.key, blob);
    return handle('POST', `/files/${start.body.data.file.fileId}/complete`, undefined, token);
  }

  // Gives a brand-new demo account realistic sample data for presentations.
  async function seed(userId) {
    const token = DEMO_TOKEN_PREFIX + userId;
    const today = todayString();
    for (const name of ['DBMS', 'Operating Systems', 'Artificial Intelligence', 'Cloud Computing']) {
      await handle('POST', '/subjects', { name }, token);
    }

    const samples = [
      ['DBMS Assignment 3: Normalization', 'DBMS', 4, 'HIGH', 'Solve the 1NF to BCNF problems from Unit 3, questions 1 to 8.'],
      ['AI Module 3 quiz preparation', 'Artificial Intelligence', 2, 'MEDIUM', 'Revise search algorithms: BFS, DFS, A*.'],
      ['OS Lab: CPU scheduling simulator', 'Operating Systems', 9, 'MEDIUM', 'Implement FCFS, SJF and Round Robin and compare waiting times.'],
      ['AWS architecture diagram', 'Cloud Computing', 14, 'LOW', 'Draw the serverless architecture for the class project.'],
      ['OS reading: Chapter 5 deadlocks', 'Operating Systems', -1, 'LOW', ''],
    ];
    for (const [title, subject, offset, priority, description] of samples) {
      await handle('POST', '/assignments', { title, subject, dueDate: addDays(today, offset), priority, description }, token);
    }
    const done = await handle(
      'POST',
      '/assignments',
      { title: 'DBMS ER diagram', subject: 'DBMS', dueDate: addDays(today, -3), priority: 'MEDIUM' },
      token,
    );
    await handle('PUT', `/assignments/${done.body.data.assignmentId}`, { completed: true }, token);

    const notes = [
      ['Cloud_Computing_Notes.txt', 'Cloud Computing', 'Cloud computing notes\n\nIaaS, PaaS, SaaS\nRegions and Availability Zones\nServerless: Lambda + API Gateway\n'],
      ['DBMS_Unit_3_Summary.txt', 'DBMS', 'DBMS Unit 3\n\n1NF: atomic values\n2NF: no partial dependency\n3NF: no transitive dependency\nBCNF: every determinant is a candidate key\n'],
    ];
    for (const [fileName, subject, text] of notes) {
      await uploadBlob(token, { fileName, subject, blob: new Blob([text], { type: 'text/plain' }) });
    }
  }

  return { request, seed, blobs };
}

let instance;
export function getDemoBackend() {
  instance ??= createDemoBackend({ storageArea: localStorage, blobs: indexedDbBlobStore, latencyMs: 250 });
  return instance;
}
