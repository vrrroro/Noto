import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoBackend, DEMO_TOKEN_PREFIX } from './demoBackend.js';
import { createMemoryBlobStore } from './blobStore.js';

function memoryStorageArea() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

const TOKEN_A = `${DEMO_TOKEN_PREFIX}user-a`;
const TOKEN_B = `${DEMO_TOKEN_PREFIX}user-b`;

describe('demo backend (real Lambda logic in the browser)', () => {
  let area;
  let backend;

  beforeEach(() => {
    area = memoryStorageArea();
    backend = createDemoBackend({ storageArea: area, blobs: createMemoryBlobStore() });
  });

  it('seeds realistic sample data for a new user', async () => {
    await backend.seed('user-a');
    const subjects = await backend.request('GET', '/subjects', undefined, TOKEN_A);
    const assignments = await backend.request('GET', '/assignments', undefined, TOKEN_A);
    const files = await backend.request('GET', '/files', undefined, TOKEN_A);

    expect(subjects.body.data).toHaveLength(4);
    expect(assignments.body.data).toHaveLength(6);
    expect(assignments.body.data.filter((a) => a.completed)).toHaveLength(1);
    expect(files.body.data.map((f) => f.status)).toEqual(['UPLOADED', 'UPLOADED']);
  });

  it('keeps users isolated and rejects missing tokens', async () => {
    await backend.seed('user-a');
    const other = await backend.request('GET', '/assignments', undefined, TOKEN_B);
    expect(other.body.data).toEqual([]);

    const anon = await backend.request('GET', '/assignments', undefined, undefined);
    expect(anon.status).toBe(401);
  });

  it('routes path parameters and returns backend validation errors', async () => {
    await backend.request('POST', '/subjects', { name: 'DBMS' }, TOKEN_A);
    const bad = await backend.request('POST', '/assignments', { title: '', subject: 'DBMS', dueDate: '2026-10-15' }, TOKEN_A);
    expect(bad.status).toBe(400);
    expect(bad.body.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Title is required.' });

    const created = await backend.request('POST', '/assignments', { title: 'A', subject: 'DBMS', dueDate: '2026-10-15' }, TOKEN_A);
    const id = created.body.data.assignmentId;
    const done = await backend.request('PUT', `/assignments/${id}`, { completed: true }, TOKEN_A);
    expect(done.body.data.completed).toBe(true);

    const missing = await backend.request('GET', '/nope', undefined, TOKEN_A);
    expect(missing.status).toBe(404);
  });

  it('persists data to the storage area so it survives a reload', async () => {
    await backend.request('POST', '/subjects', { name: 'Cloud Computing' }, TOKEN_A);
    const reloaded = createDemoBackend({ storageArea: area, blobs: createMemoryBlobStore() });
    const res = await reloaded.request('GET', '/subjects', undefined, TOKEN_A);
    expect(res.body.data.map((s) => s.name)).toEqual(['Cloud Computing']);
  });
});
