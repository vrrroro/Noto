import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, USER_A, USER_B } from './helpers.js';

let app;
const upload = { fileName: 'DBMS Unit 3.pdf', fileSize: 1200, subject: 'DBMS' };

beforeEach(async () => {
  app = createTestApp();
  await app.call('subjects', 'POST /subjects', { body: { name: 'DBMS' } });
});

// Simulates the full flow: request upload -> browser uploads to S3 -> confirm.
async function uploadFile(body = upload, userId = USER_A) {
  const start = await app.call('files', 'POST /files', { userId, body });
  assert.equal(start.status, 201);
  const { file } = start.body.data;
  app.deps.storage.objects.set(start.body.data.upload.fields.key, body.fileSize);
  const done = await app.call('files', 'POST /files/{id}/complete', { userId, params: { id: file.fileId } });
  assert.equal(done.status, 200);
  return done.body.data;
}

test('upload request returns a presigned POST scoped to the user’s prefix', async () => {
  const res = await app.call('files', 'POST /files', { body: upload });
  assert.equal(res.status, 201);
  const { file, upload: presigned } = res.body.data;

  assert.equal(file.status, 'PENDING');
  assert.equal(file.contentType, 'application/pdf');
  assert.equal(file.s3Key, `users/${USER_A}/files/${file.fileId}/DBMS Unit 3.pdf`);
  assert.equal(presigned.fields.key, file.s3Key);

  const stored = await app.deps.files.get(USER_A, file.fileId);
  assert.ok(stored.expiresAt > 0, 'pending uploads have a TTL');

  const list = await app.call('files', 'GET /files');
  assert.deepEqual(list.body.data, [], 'pending uploads are not listed');
});

test('confirming before the object exists fails', async () => {
  const { body } = await app.call('files', 'POST /files', { body: upload });
  const res = await app.call('files', 'POST /files/{id}/complete', { params: { id: body.data.file.fileId } });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.code, 'UPLOAD_INCOMPLETE');
});

test('confirmed upload is listed with its real size and no TTL', async () => {
  const file = await uploadFile();
  assert.equal(file.status, 'UPLOADED');
  assert.equal(file.uploadedAt, '2026-10-06T10:00:00.000Z');

  const stored = await app.deps.files.get(USER_A, file.fileId);
  assert.equal(stored.expiresAt, undefined);

  const list = await app.call('files', 'GET /files');
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].fileName, 'DBMS Unit 3.pdf');
});

test('rejects unsupported types, oversized files and unknown subjects', async () => {
  const exe = await app.call('files', 'POST /files', { body: { ...upload, fileName: 'game.exe' } });
  assert.equal(exe.body.error.code, 'UNSUPPORTED_FILE_TYPE');

  const big = await app.call('files', 'POST /files', { body: { ...upload, fileSize: 11 * 1024 * 1024 } });
  assert.equal(big.body.error.code, 'FILE_TOO_LARGE');

  const subject = await app.call('files', 'POST /files', { body: { ...upload, subject: 'Nope' } });
  assert.equal(subject.body.error.code, 'SUBJECT_NOT_FOUND');
});

test('download returns a short-lived link only for uploaded files', async () => {
  const file = await uploadFile();
  const res = await app.call('files', 'GET /files/{id}/download', { params: { id: file.fileId } });
  assert.equal(res.status, 200);
  assert.match(res.body.data.url, /^https:\/\/s3\.test\/download\//);
  assert.equal(res.body.data.expiresIn, 300);

  const pending = await app.call('files', 'POST /files', { body: upload });
  const notYet = await app.call('files', 'GET /files/{id}/download', {
    params: { id: pending.body.data.file.fileId },
  });
  assert.equal(notYet.status, 404);
});

test('user B cannot list, download, confirm or delete user A’s files', async () => {
  const file = await uploadFile();
  const params = { id: file.fileId };

  const list = await app.call('files', 'GET /files', { userId: USER_B });
  assert.deepEqual(list.body.data, []);

  for (const route of ['GET /files/{id}/download', 'POST /files/{id}/complete', 'DELETE /files/{id}']) {
    const res = await app.call('files', route, { userId: USER_B, params });
    assert.equal(res.status, 404, route);
  }
  assert.ok(app.deps.storage.objects.has(file.s3Key), 'object still exists');
});

test('delete removes both the S3 object and the metadata', async () => {
  const file = await uploadFile();
  const res = await app.call('files', 'DELETE /files/{id}', { params: { id: file.fileId } });
  assert.equal(res.status, 200);
  assert.equal(app.deps.storage.objects.has(file.s3Key), false);
  assert.equal(await app.deps.files.get(USER_A, file.fileId), null);
});

test('an object larger than the limit is removed on confirm', async () => {
  const { body } = await app.call('files', 'POST /files', { body: upload });
  app.deps.storage.objects.set(body.data.upload.fields.key, 50 * 1024 * 1024);
  const res = await app.call('files', 'POST /files/{id}/complete', { params: { id: body.data.file.fileId } });
  assert.equal(res.status, 400);
  assert.equal(app.deps.storage.objects.size, 0);
});
