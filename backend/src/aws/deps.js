import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { createDynamoRepository } from './dynamoRepository.js';
import { createS3Storage } from './s3Storage.js';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

let documentClient;
const doc = () =>
  (documentClient ??= DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  }));

// Each Lambda asks only for the repositories it needs; the table names
// come from environment variables set by the SAM template.
export const assignmentsRepo = () => createDynamoRepository(doc(), requireEnv('ASSIGNMENTS_TABLE'), 'assignmentId');
export const subjectsRepo = () => createDynamoRepository(doc(), requireEnv('SUBJECTS_TABLE'), 'subjectId');
export const filesRepo = () => createDynamoRepository(doc(), requireEnv('FILES_TABLE'), 'fileId');
export const filesStorage = () => createS3Storage(new S3Client({}), requireEnv('FILES_BUCKET'));
