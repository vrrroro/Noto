// Tests for the real AWS adapters. No network calls: DynamoDB is replaced by
// a recording fake, and S3 presigning is a purely local signing operation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
import { createDynamoRepository } from '../src/aws/dynamoRepository.js';
import { createS3Storage } from '../src/aws/s3Storage.js';

function fakeDoc(responses = []) {
  const sent = [];
  return {
    sent,
    async send(command) {
      sent.push({ name: command.constructor.name, input: command.input });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next ?? {};
    },
  };
}

const conditionFailed = () => Object.assign(new Error('failed'), { name: 'ConditionalCheckFailedException' });

test('list queries by userId and follows pagination', async () => {
  const doc = fakeDoc([{ Items: [{ a: 1 }], LastEvaluatedKey: { k: 1 } }, { Items: [{ a: 2 }] }]);
  const repo = createDynamoRepository(doc, 'assignments-table', 'assignmentId');
  const items = await repo.list('user-1');

  assert.deepEqual(items, [{ a: 1 }, { a: 2 }]);
  assert.equal(doc.sent.length, 2);
  assert.equal(doc.sent[0].name, 'QueryCommand');
  assert.equal(doc.sent[0].input.KeyConditionExpression, 'userId = :u');
  assert.deepEqual(doc.sent[0].input.ExpressionAttributeValues, { ':u': 'user-1' });
  assert.deepEqual(doc.sent[1].input.ExclusiveStartKey, { k: 1 });
});

test('get and create always use the composite key', async () => {
  const doc = fakeDoc([{ Item: { assignmentId: 'x' } }, {}]);
  const repo = createDynamoRepository(doc, 't', 'assignmentId');
  await repo.get('user-1', 'x');
  await repo.create({ userId: 'user-1', assignmentId: 'y' });

  assert.deepEqual(doc.sent[0].input.Key, { userId: 'user-1', assignmentId: 'x' });
  assert.equal(doc.sent[1].input.ConditionExpression, 'attribute_not_exists(#id)');
});

test('update builds SET/REMOVE expressions and returns null when missing', async () => {
  const doc = fakeDoc([{ Attributes: { done: true } }, conditionFailed()]);
  const repo = createDynamoRepository(doc, 't', 'fileId');

  const updated = await repo.update('u', 'f', { status: 'UPLOADED', fileSize: 5 }, { remove: ['expiresAt'] });
  assert.deepEqual(updated, { done: true });
  const input = doc.sent[0].input;
  assert.equal(input.UpdateExpression, 'SET #f0 = :v0, #f1 = :v1 REMOVE #r0');
  assert.deepEqual(input.ExpressionAttributeNames, {
    '#id': 'fileId',
    '#f0': 'status',
    '#f1': 'fileSize',
    '#r0': 'expiresAt',
  });
  assert.equal(input.ConditionExpression, 'attribute_exists(#id)');

  assert.equal(await repo.update('u', 'missing', { a: 1 }), null);
});

test('remove returns false when the item does not exist', async () => {
  const doc = fakeDoc([{}, conditionFailed()]);
  const repo = createDynamoRepository(doc, 't', 'subjectId');
  assert.equal(await repo.remove('u', 's1'), true);
  assert.equal(await repo.remove('u', 's2'), false);
});

test('unexpected DynamoDB errors are re-thrown', async () => {
  const repo = createDynamoRepository(fakeDoc([new Error('boom')]), 't', 'subjectId');
  await assert.rejects(repo.remove('u', 's'), /boom/);
});

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: { accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'test-secret' },
});

test('presigned POST locks the key, content type and size range', async () => {
  const storage = createS3Storage(s3, 'files-bucket');
  const upload = await storage.createUpload({ key: 'users/u/files/f/a.pdf', contentType: 'application/pdf', maxSize: 100 });

  assert.match(upload.url, /files-bucket/);
  assert.equal(upload.fields.key, 'users/u/files/f/a.pdf');
  assert.equal(upload.fields['Content-Type'], 'application/pdf');
  const policy = JSON.parse(Buffer.from(upload.fields.Policy, 'base64').toString('utf8'));
  assert.deepEqual(
    policy.conditions.find((c) => Array.isArray(c) && c[0] === 'content-length-range'),
    ['content-length-range', 1, 100],
  );
  assert.equal(upload.expiresIn, 300);
});

test('download URL is signed, short-lived and forces an attachment', async () => {
  const storage = createS3Storage(s3, 'files-bucket');
  const url = new URL(await storage.createDownloadUrl({ key: 'users/u/files/f/Notes é.pdf', fileName: 'Notes é.pdf', contentType: 'application/pdf' }));

  assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
  const disposition = url.searchParams.get('response-content-disposition');
  assert.match(disposition, /^attachment; filename="Notes _.pdf"; filename\*=UTF-8''Notes%20%C3%A9\.pdf$/);
});
