// Browser check of the hosted website (WebsiteUrl output) against the live AWS backend.
// Usage:  node e2e/live-site.mjs        (needs the AWS CLI configured for the stack's account)
// Env:    STACK_NAME (default student-cloud-manager-dev), AWS_REGION (default ap-south-1),
//         CHROME_PATH (auto-detected on Windows/macOS/Linux)
// Creates one temporary Cognito user with a random password, signs in through the real UI and
// walks subjects, assignments and files, then deletes the user and anything it left behind.
import puppeteer from 'puppeteer-core';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STACK = process.env.STACK_NAME || 'student-cloud-manager-dev';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const TMP = path.join(HERE, '.tmp', 'live-site-' + Date.now());
fs.mkdirSync(TMP, { recursive: true });

const aws = (...args) =>
  execFileSync('aws', [...args, '--region', REGION, '--output', 'json'], { encoding: 'utf8' });
const outputs = Object.fromEntries(
  JSON.parse(aws('cloudformation', 'describe-stacks', '--stack-name', STACK)).Stacks[0].Outputs.map((o) => [o.OutputKey, o.OutputValue]),
);
const SITE = outputs.WebsiteUrl;
const POOL = outputs.UserPoolId;
if (!SITE) throw new Error(`Stack ${STACK} has no WebsiteUrl output.`);

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH.');
  return found;
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? ' — ' + detail : ''}`);
};

const user = {
  email: `scm-live-site-${Date.now()}@example.com`,
  password: `Aa1!${crypto.randomBytes(12).toString('base64url')}`,
};
const SUBJECT = 'Cloud Computing';
const TITLE = 'Live site check';
const FILE = 'live-site-check.pdf';

aws('cognito-idp', 'admin-create-user', '--user-pool-id', POOL, '--username', user.email,
  '--user-attributes', `Name=email,Value=${user.email}`, 'Name=email_verified,Value=true',
  '--message-action', 'SUPPRESS');
aws('cognito-idp', 'admin-set-user-password', '--user-pool-id', POOL, '--username', user.email,
  '--password', user.password, '--permanent');

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-first-run', '--no-default-browser-check'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 860 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const cdp = await page.createCDPSession();
await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: TMP });

const text = () => page.evaluate(() => document.body.innerText);
const waitText = (t, timeout = 15000) =>
  page.waitForFunction((s) => document.body.innerText.includes(s), { timeout }, t);
const click = (selector) => page.locator(selector).click();
const fill = (selector, value) => page.locator(selector).fill(value);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const closeToasts = () => page.evaluate(() => document.querySelectorAll('.toast-close').forEach((b) => b.click()));
const cardButton = (label, name) => page.$(`xpath///article[contains(., "${label}")]//button[contains(., "${name}")]`);

// Removes whatever this run created, through the API with the test user's own token.
async function cleanup() {
  const token = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const value = localStorage.getItem(localStorage.key(i));
      if (value && value.includes('accessToken')) return JSON.parse(value).accessToken;
    }
    return null;
  }).catch(() => null);
  if (!token) return;
  const call = (method, p) =>
    fetch(outputs.ApiUrl + p, { method, headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null);
  for (const a of (await call('GET', '/assignments'))?.data ?? []) await call('DELETE', `/assignments/${a.assignmentId}`);
  for (const f of (await call('GET', '/files'))?.data ?? []) await call('DELETE', `/files/${f.fileId}`);
  for (const s of (await call('GET', '/subjects'))?.data ?? []) await call('DELETE', `/subjects/${s.subjectId}`);
}

try {
  const home = await fetch(SITE + '/assignments');
  check('Deep link /assignments serves the app over HTTPS', home.ok && SITE.startsWith('https://') && (await home.text()).includes('<title>Noto</title>'));

  await page.goto(SITE);
  await page.waitForSelector('#login-email');
  check('Unauthenticated visitor lands on sign-in', page.url().endsWith('/login'));
  check('Live mode (no demo banner)', !(await text()).includes('Demo mode'));

  await fill('#login-email', user.email);
  await fill('#login-password', 'Wrong-password-1!');
  await click('button[type=submit]');
  await waitText('Incorrect email or password.');
  check('Cognito rejects a wrong password in the UI', true);

  await fill('#login-password', user.password);
  await click('button[type=submit]');
  await waitText('Recent files');
  check('Sign-in reaches the dashboard', (await text()).includes('Hello,'));

  // --- Subject ---
  await click('a.nav-link[href="/subjects"]');
  await page.waitForSelector('#subject-name');
  await fill('#subject-name', SUBJECT);
  await click('.inline-form button[type=submit]');
  await waitText(`Added “${SUBJECT}”`);
  check('Create subject (DynamoDB)', true);

  // --- Assignment ---
  await click('a.nav-link[href="/assignments"]');
  await waitText('Create assignment');
  await click('.page-actions button');
  await page.waitForSelector('#assignment-title');
  await fill('#assignment-title', TITLE);
  await page.select('#assignment-subject', SUBJECT);
  await click('dialog button[type=submit]');
  await waitText(`Created “${TITLE}”`);
  check('Create assignment', (await page.$$('.assignment-card')).length === 1);
  await closeToasts();
  await (await cardButton(TITLE, 'Complete')).click();
  await waitText(`Marked “${TITLE}” complete.`);
  check('Mark assignment complete', true);

  await page.reload();
  await page.waitForSelector('.assignment-card');
  check('Assignment persists after refresh on a deep link', (await text()).includes(TITLE));

  // --- File: presigned upload to S3, download, delete ---
  await click('a.nav-link[href="/notes"]');
  await page.waitForSelector('input[type=file]');
  const src = path.join(TMP, 'src-' + FILE);
  fs.writeFileSync(src, '%PDF-1.4\n% live site check\n' + crypto.randomBytes(2048).toString('hex'));
  await (await page.$('input[type=file]')).uploadFile(src);
  await page.select('.upload-controls select', SUBJECT);
  await click('.upload-controls button[type=submit]');
  await waitText(`Uploaded “${path.basename(src)}”`, 20000);
  check('Upload file to S3', (await page.$$('.file-card')).length === 1);

  await closeToasts();
  await (await cardButton(path.basename(src), 'Download')).click();
  const saved = path.join(TMP, path.basename(src));
  let downloaded = false;
  for (let i = 0; i < 50 && !downloaded; i++) {
    await sleep(200);
    downloaded = fs.existsSync(saved) && fs.readFileSync(saved).equals(fs.readFileSync(src));
  }
  check('Download file (bytes match the upload)', downloaded);
  await page.waitForFunction(() => [...document.querySelectorAll('.file-card button')].every((b) => !b.disabled));

  await (await cardButton(path.basename(src), 'Delete')).click();
  await click('dialog[open] .btn-danger');
  await waitText('File deleted.');
  check('Delete file', (await page.$$('.file-card')).length === 0);

  // --- Tidy up through the UI ---
  await click('a.nav-link[href="/assignments"]');
  await page.waitForSelector('.assignment-card');
  await (await cardButton(TITLE, 'Delete')).click();
  await click('dialog[open] .btn-danger');
  await waitText('Assignment deleted.');
  check('Delete assignment', true);

  await click('a.nav-link[href="/subjects"]');
  await page.waitForSelector(`button[aria-label="Delete subject ${SUBJECT}"]`);
  await click(`button[aria-label="Delete subject ${SUBJECT}"]`);
  await click('dialog[open] .btn-danger');
  await waitText(`Deleted “${SUBJECT}”`);
  check('Delete subject', true);

  await page.locator('button.nav-button::-p-text(Sign out)').click();
  await page.waitForSelector('#login-email');
  await page.goto(SITE + '/notes');
  await page.waitForSelector('#login-email');
  check('Sign out + protected route redirect', page.url().endsWith('/login'));
} catch (err) {
  check('Live site run completed without exception', false, err.stack);
  await page.screenshot({ path: path.join(TMP, 'failure.png'), fullPage: true }).catch(() => {});
  await cleanup();
} finally {
  const relevant = errors.filter((e) => !/favicon|Incorrect email or password|status of 400/.test(e));
  check('No browser console errors', relevant.length === 0, relevant.slice(0, 5).join(' | '));
  await browser.close();
  aws('cognito-idp', 'admin-delete-user', '--user-pool-id', POOL, '--username', user.email);
  console.log('Deleted the temporary user.');
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}
