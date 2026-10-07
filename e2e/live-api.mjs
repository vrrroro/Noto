// Live API check against the deployed AWS stack (Cognito + API Gateway + Lambda + DynamoDB + S3).
// Usage:  node e2e/live-api.mjs            (needs the AWS CLI configured for the stack's account)
// Env:    STACK_NAME (default student-cloud-manager-dev), AWS_REGION (default ap-south-1)
// Creates two temporary Cognito users with random passwords, exercises every endpoint, checks
// cross-user isolation, then deletes everything it created. No secrets are printed.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const STACK = process.env.STACK_NAME || 'student-cloud-manager-dev';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const ORIGIN = 'http://localhost:5173';

const aws = (...args) =>
  execFileSync('aws', [...args, '--region', REGION, '--output', 'json'], { encoding: 'utf8' });
const awsJson = (...args) => JSON.parse(aws(...args) || 'null');

const outputs = Object.fromEntries(
  awsJson('cloudformation', 'describe-stacks', '--stack-name', STACK).Stacks[0].Outputs.map((o) => [o.OutputKey, o.OutputValue]),
);
const API = outputs.ApiUrl;
const POOL = outputs.UserPoolId;
const CLIENT = outputs.UserPoolClientId;

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ' — ' + detail : ''}`);
};

const stamp = Date.now();
const users = ['a', 'b'].map((tag) => ({
  email: `scm-live-test-${tag}-${stamp}@example.com`,
  password: `Aa1!${crypto.randomBytes(12).toString('base64url')}`,
}));

async function signIn(user) {
  const res = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT,
      AuthParameters: { USERNAME: user.email, PASSWORD: user.password },
    }),
  });
  const body = await res.json();
  return body.AuthenticationResult?.AccessToken;
}

function client(token) {
  return async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, json };
  };
}

async function main() {
  // ---- Users ---------------------------------------------------------------
  for (const u of users) {
    aws('cognito-idp', 'admin-create-user', '--user-pool-id', POOL, '--username', u.email,
      '--user-attributes', `Name=email,Value=${u.email}`, 'Name=email_verified,Value=true',
      '--message-action', 'SUPPRESS');
    aws('cognito-idp', 'admin-set-user-password', '--user-pool-id', POOL, '--username', u.email,
      '--password', u.password, '--permanent');
  }
  const [tokenA, tokenB] = [await signIn(users[0]), await signIn(users[1])];
  check('Cognito sign-in returns tokens for both users', Boolean(tokenA && tokenB));

  const wrong = await signIn({ email: users[0].email, password: 'Wrong-password-1!' });
  check('Cognito rejects a wrong password', !wrong);

  const anon = client(null);
  const A = client(tokenA);
  const B = client(tokenB);

  // ---- Auth boundary -------------------------------------------------------
  check('No token → 401', (await anon('GET', '/assignments')).status === 401);
  check('Garbage token → 401', (await client('not-a-jwt')('GET', '/assignments')).status === 401);

  const pre = await fetch(API + '/assignments', {
    method: 'OPTIONS',
    headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
  });
  check('CORS preflight allows the local dev origin', pre.headers.get('access-control-allow-origin') === ORIGIN);

  // ---- Subjects ------------------------------------------------------------
  const subj = await A('POST', '/subjects', { name: 'DBMS' });
  check('Create subject → 201', subj.status === 201 && subj.json?.success === true, JSON.stringify(subj.json));
  check('Duplicate subject → 409', (await A('POST', '/subjects', { name: 'dbms' })).status === 409);
  const subjects = await A('GET', '/subjects');
  check('List subjects', subjects.status === 200 && subjects.json.data.some((s) => s.name === 'DBMS'));
  check('User B sees no subjects of A', (await B('GET', '/subjects')).json?.data?.length === 0);

  // ---- Assignments ---------------------------------------------------------
  const created = await A('POST', '/assignments', {
    title: 'DBMS Assignment 3', description: 'Normalization problems', subject: 'DBMS', dueDate: '2026-10-15', priority: 'HIGH',
  });
  const assignmentId = created.json?.data?.assignmentId;
  check('Create assignment → 201 (DynamoDB write)', created.status === 201 && Boolean(assignmentId), JSON.stringify(created.json));
  check('Empty title → 400', (await A('POST', '/assignments', { title: '', subject: 'DBMS', dueDate: '2026-10-15' })).status === 400);
  check('dueDate "banana" → 400', (await A('POST', '/assignments', { title: 'x', subject: 'DBMS', dueDate: 'banana' })).status === 400);

  const list = await A('GET', '/assignments');
  check('List assignments includes it', list.json?.data?.some((a) => a.assignmentId === assignmentId));
  const one = await A('GET', `/assignments/${assignmentId}`);
  check('Get one assignment', one.status === 200 && one.json.data.title === 'DBMS Assignment 3');
  const done = await A('PUT', `/assignments/${assignmentId}`, { completed: true });
  check('Mark complete', done.status === 200 && done.json.data.completed === true);

  check('User B: list is empty', (await B('GET', '/assignments')).json?.data?.length === 0);
  check("User B: GET A's assignment → 404", (await B('GET', `/assignments/${assignmentId}`)).status === 404);
  check("User B: PUT A's assignment → 404", (await B('PUT', `/assignments/${assignmentId}`, { completed: false })).status === 404);
  check("User B: DELETE A's assignment → 404", (await B('DELETE', `/assignments/${assignmentId}`)).status === 404);
  check("A's assignment unchanged after B's attempts", (await A('GET', `/assignments/${assignmentId}`)).json?.data?.completed === true);

  // ---- Files (S3 presigned POST + GET) -------------------------------------
  const content = Buffer.from(`Live S3 round-trip ${stamp}\n`.repeat(50));
  const up = await A('POST', '/files', { fileName: 'DBMS_Unit_3.txt', fileSize: content.length, subject: 'DBMS' });
  const fileId = up.json?.data?.file?.fileId;
  check('Request upload → 201 with presigned POST', up.status === 201 && Boolean(up.json?.data?.upload?.url), JSON.stringify(up.json));

  const form = new FormData();
  for (const [k, v] of Object.entries(up.json.data.upload.fields)) form.append(k, v);
  form.append('file', new Blob([content], { type: up.json.data.upload.fields['Content-Type'] }), 'DBMS_Unit_3.txt');
  const s3 = await fetch(up.json.data.upload.url, { method: 'POST', body: form });
  check('Upload reaches S3 (presigned POST)', s3.status === 204 || s3.status === 201, `S3 status ${s3.status}`);

  const complete = await A('POST', `/files/${fileId}/complete`);
  check('Complete upload → UPLOADED', complete.status === 200 && complete.json.data.status === 'UPLOADED', JSON.stringify(complete.json));
  check('File appears in list', (await A('GET', '/files')).json?.data?.some((f) => f.fileId === fileId));

  const dl = await A('GET', `/files/${fileId}/download`);
  const bytes = Buffer.from(await (await fetch(dl.json.data.url)).arrayBuffer());
  check('Download is byte-identical', bytes.equals(content));

  check("User B: download A's file → 404", (await B('GET', `/files/${fileId}/download`)).status === 404);
  check("User B: delete A's file → 404", (await B('DELETE', `/files/${fileId}`)).status === 404);
  check('Unsupported type (.exe) → 400', (await A('POST', '/files', { fileName: 'x.exe', fileSize: 10, subject: 'DBMS' })).status === 400);
  check('Oversized (11 MB) → 400', (await A('POST', '/files', { fileName: 'big.pdf', fileSize: 11 * 1024 * 1024, subject: 'DBMS' })).status === 400);

  const tamper = new FormData();
  for (const [k, v] of Object.entries(up.json.data.upload.fields)) tamper.append(k, k === 'key' ? v.replace(/users\/[^/]+/, 'users/someone-else') : v);
  tamper.append('file', new Blob([content], { type: 'text/plain' }), 'x.txt');
  const s3bad = await fetch(up.json.data.upload.url, { method: 'POST', body: tamper });
  check('S3 rejects an upload to another user\'s key', s3bad.status === 403, `S3 status ${s3bad.status}`);

  // ---- Clean-up through the API (also tests delete) -------------------------
  check('Subject in use → 409', (await A('DELETE', `/subjects/${subj.json.data.subjectId}`)).status === 409);
  check('Delete file', (await A('DELETE', `/files/${fileId}`)).status === 200);
  check('Deleted file no longer downloadable', (await A('GET', `/files/${fileId}/download`)).status === 404);
  check('Delete assignment', (await A('DELETE', `/assignments/${assignmentId}`)).status === 200);
  check('Delete subject', (await A('DELETE', `/subjects/${subj.json.data.subjectId}`)).status === 200);
}

try {
  await main();
} catch (err) {
  check('Unexpected error', false, err.message);
} finally {
  for (const u of users) {
    try { aws('cognito-idp', 'admin-delete-user', '--user-pool-id', POOL, '--username', u.email); } catch { /* not created */ }
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed; test users deleted.`);
  process.exitCode = failed ? 1 : 0;
}
