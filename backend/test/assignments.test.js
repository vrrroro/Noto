import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, USER_A, USER_B } from './helpers.js';
import { createAssignmentsHandler } from '../src/apps/assignments.js';
import { silentLogger } from '../src/shared/logger.js';
import { makeEvent } from './helpers.js';

let app;
const newAssignment = { title: 'DBMS Assignment 3', subject: 'DBMS', dueDate: '2026-10-15', priority: 'HIGH' };

async function createSubject(name, userId = USER_A) {
  return app.call('subjects', 'POST /subjects', { userId, body: { name } });
}

async function createAssignment(body = newAssignment, userId = USER_A) {
  return app.call('assignments', 'POST /assignments', { userId, body });
}

beforeEach(async () => {
  app = createTestApp();
  await createSubject('DBMS');
  await createSubject('Operating Systems');
});

test('creates an assignment owned by the authenticated user', async () => {
  const res = await createAssignment({ ...newAssignment, userId: USER_B });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.title, 'DBMS Assignment 3');
  assert.equal(res.body.data.completed, false);
  assert.equal(res.body.data.userId, undefined, 'owner field is not exposed');

  const stored = await app.deps.assignments.get(USER_A, res.body.data.assignmentId);
  assert.equal(stored.userId, USER_A, 'userId from the body is ignored');
});

test('uses the canonical subject name and rejects unknown subjects', async () => {
  const res = await createAssignment({ ...newAssignment, subject: 'dbms' });
  assert.equal(res.body.data.subject, 'DBMS');

  const bad = await createAssignment({ ...newAssignment, subject: 'Astrology' });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'SUBJECT_NOT_FOUND');
});

test('lists only the user’s assignments, sorted by due date', async () => {
  await createAssignment({ ...newAssignment, title: 'Later', dueDate: '2026-11-01' });
  await createAssignment({ ...newAssignment, title: 'Sooner', dueDate: '2026-10-08' });
  await createSubject('DBMS', USER_B);
  await createAssignment({ ...newAssignment, title: 'B private' }, USER_B);

  const res = await app.call('assignments', 'GET /assignments');
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.data.map((a) => a.title),
    ['Sooner', 'Later'],
  );
});

test('gets, updates, completes and deletes an assignment', async () => {
  const { body } = await createAssignment();
  const id = body.data.assignmentId;

  const got = await app.call('assignments', 'GET /assignments/{id}', { params: { id } });
  assert.equal(got.status, 200);

  const done = await app.call('assignments', 'PUT /assignments/{id}', { params: { id }, body: { completed: true } });
  assert.equal(done.status, 200);
  assert.equal(done.body.data.completed, true);
  assert.equal(done.body.data.title, 'DBMS Assignment 3');

  const edited = await app.call('assignments', 'PUT /assignments/{id}', {
    params: { id },
    body: { title: 'Renamed', subject: 'operating systems' },
  });
  assert.equal(edited.body.data.title, 'Renamed');
  assert.equal(edited.body.data.subject, 'Operating Systems');

  const deleted = await app.call('assignments', 'DELETE /assignments/{id}', { params: { id } });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.message, 'Assignment deleted.');

  const gone = await app.call('assignments', 'GET /assignments/{id}', { params: { id } });
  assert.equal(gone.status, 404);
  assert.equal(gone.body.error.code, 'ASSIGNMENT_NOT_FOUND');
});

test('user B cannot read, update or delete user A’s assignment', async () => {
  const { body } = await createAssignment();
  const id = body.data.assignmentId;

  const read = await app.call('assignments', 'GET /assignments/{id}', { userId: USER_B, params: { id } });
  const update = await app.call('assignments', 'PUT /assignments/{id}', {
    userId: USER_B,
    params: { id },
    body: { completed: true },
  });
  const remove = await app.call('assignments', 'DELETE /assignments/{id}', { userId: USER_B, params: { id } });

  for (const res of [read, update, remove]) {
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  }

  const stored = await app.deps.assignments.get(USER_A, id);
  assert.equal(stored.completed, false, 'record is unchanged');
});

test('rejects invalid input with a predictable error format', async () => {
  const empty = await createAssignment({ ...newAssignment, title: '' });
  assert.equal(empty.status, 400);
  assert.deepEqual(empty.body, {
    success: false,
    error: { code: 'VALIDATION_ERROR', message: 'Title is required.' },
  });

  const banana = await createAssignment({ ...newAssignment, dueDate: 'banana' });
  assert.equal(banana.status, 400);

  const badJson = await app.call('assignments', 'POST /assignments', { rawBody: '{not json' });
  assert.equal(badJson.status, 400);
  assert.equal(badJson.body.error.code, 'INVALID_JSON');
});

test('rejects unauthenticated requests and unknown routes', async () => {
  const anon = await app.call('assignments', 'GET /assignments', { userId: null });
  assert.equal(anon.status, 401);
  assert.equal(anon.body.error.code, 'UNAUTHORIZED');

  const unknown = await app.call('assignments', 'PATCH /assignments');
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error.code, 'ROUTE_NOT_FOUND');
});

test('hides internal errors from the client', async () => {
  const handler = createAssignmentsHandler({
    assignments: {
      list: async () => {
        throw new Error('DynamoDB ValidationException: secret table details');
      },
    },
    subjects: {},
    logger: silentLogger,
  });
  const res = await handler(makeEvent('GET /assignments'), {});
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 500);
  assert.equal(body.error.code, 'INTERNAL_ERROR');
  assert.doesNotMatch(body.error.message, /DynamoDB/);
});

test('decodes base64-encoded bodies', async () => {
  const event = makeEvent('POST /assignments');
  event.body = Buffer.from(JSON.stringify(newAssignment)).toString('base64');
  event.isBase64Encoded = true;
  const res = await app.handlers.assignments(event, {});
  assert.equal(res.statusCode, 201);
});
