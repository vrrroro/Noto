import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, USER_A, USER_B } from './helpers.js';

let app;

beforeEach(() => {
  app = createTestApp();
});

const createSubject = (name, userId = USER_A) => app.call('subjects', 'POST /subjects', { userId, body: { name } });

test('creates and lists subjects alphabetically', async () => {
  assert.equal((await createSubject('Operating Systems')).status, 201);
  assert.equal((await createSubject('DBMS')).status, 201);
  await createSubject('Secret', USER_B);

  const res = await app.call('subjects', 'GET /subjects');
  assert.deepEqual(
    res.body.data.map((s) => s.name),
    ['DBMS', 'Operating Systems'],
  );
});

test('rejects duplicate subject names regardless of case', async () => {
  await createSubject('DBMS');
  const dup = await createSubject('dbms');
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, 'SUBJECT_EXISTS');

  // Another user may use the same name.
  assert.equal((await createSubject('DBMS', USER_B)).status, 201);
});

test('keeps a chosen colour and rejects unknown ones', async () => {
  const res = await app.call('subjects', 'POST /subjects', { userId: USER_A, body: { name: 'DBMS', color: 'green' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.color, 'green');
  const list = await app.call('subjects', 'GET /subjects');
  assert.equal(list.body.data[0].color, 'green');

  const bad = await app.call('subjects', 'POST /subjects', { userId: USER_A, body: { name: 'AI', color: 'orange' } });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR');

  const none = await app.call('subjects', 'POST /subjects', { userId: USER_A, body: { name: 'OS' } });
  assert.equal(none.body.data.color, undefined);
});

test('rejects empty subject names', async () => {
  const res = await createSubject('   ');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('refuses to delete a subject that is still in use', async () => {
  const { body } = await createSubject('DBMS');
  const subjectId = body.data.subjectId;
  const assignment = await app.call('assignments', 'POST /assignments', {
    body: { title: 'A1', subject: 'DBMS', dueDate: '2026-10-15' },
  });

  const blocked = await app.call('subjects', 'DELETE /subjects/{id}', { params: { id: subjectId } });
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.error.code, 'SUBJECT_IN_USE');

  await app.call('assignments', 'DELETE /assignments/{id}', { params: { id: assignment.body.data.assignmentId } });
  const deleted = await app.call('subjects', 'DELETE /subjects/{id}', { params: { id: subjectId } });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.message, 'Subject deleted.');
});

test('user B cannot delete user A’s subject', async () => {
  const { body } = await createSubject('DBMS');
  const res = await app.call('subjects', 'DELETE /subjects/{id}', {
    userId: USER_B,
    params: { id: body.data.subjectId },
  });
  assert.equal(res.status, 404);
  assert.ok(await app.deps.subjects.get(USER_A, body.data.subjectId));
});
