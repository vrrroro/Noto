// End-to-end check of the whole UI in demo mode using headless Chrome.
// Usage:  (terminal 1) cd frontend && npm run dev
//         (terminal 2) cd e2e && npm install && npm test
// Env:    E2E_BASE_URL (default http://127.0.0.1:5173), CHROME_PATH (auto-detected on Windows/macOS/Linux)
// Saves screenshots to docs/screenshots/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const BASE = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const SHOTS = path.join(HERE, '..', 'docs', 'screenshots');
const TMP = path.join(HERE, '.tmp', 'downloads-' + Date.now());
const SRC = path.join(HERE, '.tmp', 'src');
fs.mkdirSync(SRC, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(SHOTS, { recursive: true });

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
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-first-run', '--no-default-browser-check'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 860 });
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
// Test-only: park toasts over the sidebar so they never cover card buttons the bot clicks.
await page.evaluateOnNewDocument(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = '.toast-region{left:8px!important;right:auto!important;width:230px!important;bottom:120px!important}';
    document.head.appendChild(s);
  });
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const cdp = await page.createCDPSession();
await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: TMP });

const text = () => page.evaluate(() => document.body.innerText);
const waitText = (t, timeout = 8000) =>
  page.waitForFunction((s) => document.body.innerText.includes(s), { timeout }, t);
const click = (selector) => page.locator(selector).click();
const fill = (selector, value) => page.locator(selector).fill(value);
const shot = async (name) => {
  await page.waitForFunction(() => !document.getElementById('boot-loader')); // the font loader has lifted
  await page.evaluate(() => { document.querySelectorAll('.toast-close').forEach((b) => b.click()); window.scrollTo(0, 0); });
  await sleep(700); // let entrance animations settle
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const count = (selector) => page.$$eval(selector, (els) => els.length);

async function register(email, password) {
  await page.goto(`${BASE}/register`);
  await fill('#register-name', 'Rohit Sharma');
  await fill('#register-email', email);
  await fill('#register-password', password);
  await fill('#register-confirm', password);
  await click('button[type=submit]');
  await waitText('Verify your email');
  await fill('#confirm-code', '123456');
  await click('button[type=submit]');
  await waitText('Email verified');
}

async function login(email, password) {
  await fill('#login-email', email);
  await fill('#login-password', password);
  await click('button[type=submit]');
}

try {
  // --- Landing ---
  await page.goto(BASE);
  await page.waitForSelector('#l-hero-title');
  check('Signed-out visitor sees the landing page', (await text()).includes('sorted.'));
  const authLinks = await page.$$eval('.landing a[href="/register"], .landing a[href="/login"]', (links) => links.length);
  check('Landing links to sign-up and sign-in', authLinks >= 4);
  // After the first-load intro: the grey layer is gone and the dot has settled.
  await page.waitForFunction(() => !document.querySelector('.l-mark-mono') && !document.querySelector('.l-mark-dot')?.style.translate, { timeout: 6000 });
  await shot('app-00-landing');
  await click('.l-nav-primary .l-signin');
  await page.waitForSelector('#login-email');

  // --- Auth ---
  await page.goto(`${BASE}/assignments`);
  await page.waitForSelector('#login-email');
  check('Unauthenticated user is redirected to login', page.url().endsWith('/login'));
  await shot('app-01-login');

  await page.goto(`${BASE}/register`);
  await fill('#register-name', 'Rohit Sharma');
  await fill('#register-email', 'rohit@college.edu');
  await fill('#register-password', 'Passw0rd!');
  await fill('#register-confirm', 'Different1');
  await click('button[type=submit]');
  await waitText('Passwords do not match.');
  check('Register rejects mismatched passwords', true);
  await fill('#register-password', 'weak');
  await fill('#register-confirm', 'weak');
  await shot('app-02-register');
  await click('button[type=submit]');
  await waitText('does not meet all the requirements');
  check('Register rejects weak password', true);

  await register('rohit@college.edu', 'Passw0rd');
  check('Register + verify email works', true);

  await page.goto(`${BASE}/register`);
  await fill('#register-name', 'Rohit Sharma');
  await fill('#register-email', 'rohit@college.edu');
  await fill('#register-password', 'Passw0rd');
  await fill('#register-confirm', 'Passw0rd');
  await click('button[type=submit]');
  await waitText('already exists');
  check('Duplicate registration rejected', true);

  await page.goto(`${BASE}/login`);
  await login('rohit@college.edu', 'WrongPass1');
  await waitText('Incorrect email or password.');
  check('Wrong password rejected', true);

  await login('rohit@college.edu', 'Passw0rd');
  await waitText('Upcoming', 10000);
  await waitText('Recent files');
  const dash = await text();
  check('Login lands on dashboard with greeting', dash.includes('Hello, Rohit'));

  // Home: the sidebar's Home opens the landing page, signed in (an account
  // menu instead of Sign in / Create account), and "/" is still the dashboard.
  const themeLabel = await page.$$eval('.nav-button', (els) => els.map((e) => e.textContent).find((t) => t.includes('Theme')));
  check('Theme switch offers only Day and Night', /Day|Night/.test(themeLabel) && !/System/.test(themeLabel), themeLabel);
  await click('.sidebar-actions a[href="/home"]');
  await page.waitForSelector('.l-nav-primary .l-account-btn');
  check(
    'Home opens the landing page signed in, with the account initial and no Sign in',
    (await page.$eval('.l-nav-primary .l-account-avatar', (e) => e.textContent)) === 'R' && !(await page.$('.l-nav-primary .l-signin')),
  );
  await click('.l-nav-primary .l-account-btn');
  await click('.l-nav-primary .l-account-menu a[href="/"]');
  await waitText('Upcoming', 10000);
  check('The account menu goes back to the dashboard', new URL(page.url()).pathname === '/');
  await page.goto(BASE);
  await waitText('Upcoming', 10000);
  check('Opening the site signed in goes straight to the dashboard', !(await page.$('.landing')));
  const stats = await page.$$eval('.stat-value', (els) => els.map((e) => e.textContent));
  check('Dashboard stats computed from data', JSON.stringify(stats) === '["6","5","1","1"]', stats.join(','));
  await shot('app-03-dashboard');

  // --- Assignments ---
  await click('a.nav-link[href="/assignments"]');
  await page.waitForSelector('.assignment-card');
  const before = await count('.assignment-card');
  await click('.page-actions button');
  await page.waitForSelector('#assignment-title');
  await click('dialog button[type=submit]');
  await waitText('Title is required.');
  check('Assignment form validates title', true);
  await fill('#assignment-title', 'Cloud Computing Mini Project');
  await page.select('#assignment-subject', 'Cloud Computing');
  await page.select('#assignment-priority', 'HIGH');
  await fill('#assignment-description', 'Deploy the serverless stack and capture screenshots.');
  await shot('app-05-assignment-form');
  await click('dialog button[type=submit]');
  await waitText('Created “Cloud Computing Mini Project”');
  check('Create assignment', (await count('.assignment-card')) === before + 1);

  // complete the new one
  const cards = await page.$$('.assignment-card');
  let target;
  for (const c of cards) if ((await c.evaluate((e) => e.innerText)).includes('Cloud Computing Mini Project')) target = c;
  await page.evaluate(() => document.querySelectorAll('.toast-close').forEach((b) => b.click()));
  await target.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await (await target.$('button.btn-success')).click();
  await waitText('Marked “Cloud Computing Mini Project” complete.');
  check('Mark assignment complete', await target.evaluate((e) => e.classList.contains('is-completed')));

  // edit
  await (await target.$('xpath/.//button[contains(., "Edit")]')).click();
  await page.waitForSelector('#assignment-title');
  await fill('#assignment-title', 'Cloud Computing Mini Project (final)');
  await click('dialog button[type=submit]');
  await waitText('Assignment updated.');
  check('Edit assignment', (await text()).includes('Cloud Computing Mini Project (final)'));

  // search + filter
  await fill('#assignment-search', 'normalization');
  await sleep(100);
  check('Search filters assignments', (await count('.assignment-card')) === 1);
  await click('#assignment-search');
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await click('.segmented button:nth-child(3)');
  await sleep(100);
  check('Status filter shows completed only', (await count('.assignment-card')) === 2);
  await click('.segmented button:nth-child(1)');
  await sleep(100);
  await shot('app-04-assignments');

  // delete
  const before2 = await count('.assignment-card');
  const delBtn = await page.$('xpath///article[contains(., "Mini Project (final)")]//button[contains(., "Delete")]');
  await delBtn.click();
  await waitText('Delete assignment?');
  await click('dialog[open] .btn-danger');
  await waitText('Assignment deleted.');
  check('Delete assignment', (await count('.assignment-card')) === before2 - 1);

  // persistence after reload
  await page.reload();
  await page.waitForSelector('.assignment-card');
  check('Assignments persist after refresh', (await count('.assignment-card')) === before2 - 1);

  // --- Notes ---
  await click('a.nav-link[href="/notes"]');
  await page.waitForSelector('.file-card');
  const pdf = path.join(SRC, 'DBMS_Unit_3.pdf');
  fs.writeFileSync(pdf, '%PDF-1.4\n% demo file\n' + 'x'.repeat(5000));
  const big = path.join(SRC, 'Huge_Lecture.pdf');
  fs.writeFileSync(big, Buffer.alloc(11 * 1024 * 1024));
  const exe = path.join(SRC, 'setup.exe');
  fs.writeFileSync(exe, 'MZ');

  const input = await page.$('input[type=file]');
  await input.uploadFile(big);
  await waitText('The limit is 10 MB');
  check('Oversized file rejected', true);
  await input.uploadFile(exe);
  await waitText('not a supported type');
  check('Unsupported file type rejected', true);

  await input.uploadFile(pdf);
  await page.select('.upload-controls select', 'DBMS');
  await click('.upload-controls button[type=submit]');
  await waitText('Uploaded “DBMS_Unit_3.pdf”', 10000);
  check('Upload file', (await count('.file-card')) === 3);
  await shot('app-06-notes');

  const dl = await page.$('xpath///article[contains(., "DBMS_Unit_3.pdf")]//button[contains(., "Download")]');
  await dl.click();
  let downloaded = false;
  for (let i = 0; i < 30 && !downloaded; i++) {
    await sleep(200);
    downloaded = fs.existsSync(path.join(TMP, 'DBMS_Unit_3.pdf')) && fs.readFileSync(path.join(TMP, 'DBMS_Unit_3.pdf')).equals(fs.readFileSync(pdf));
  }
  const files = fs.readdirSync(TMP);
  check('Download file (content matches upload)', downloaded, files.join(', '));
  await page.waitForFunction(() => [...document.querySelectorAll('.file-card button')].every((b) => !b.disabled));

  await (await page.$('xpath///article[contains(., "DBMS_Unit_3.pdf")]//button[contains(., "Delete")]')).click();
  await waitText('Delete file?');
  await click('dialog[open] .btn-danger');
  await waitText('File deleted.');
  check('Delete file', (await count('.file-card')) === 2);

  // --- Subjects ---
  await click('a.nav-link[href="/subjects"]');
  await page.waitForSelector('.subject-card');
  await fill('#subject-name', 'Software Engineering');
  await click('.inline-form button[type=submit]');
  await waitText('Added “Software Engineering”');
  check('Create subject', (await count('.subject-card')) === 5);
  await fill('#subject-name', 'dbms');
  await click('.inline-form button[type=submit]');
  await waitText('already have a subject');
  check('Duplicate subject rejected', true);
  await click('#subject-name');
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');

  await (await page.$('button[aria-label="Delete subject DBMS"]')).click();
  await click('dialog[open] .btn-danger');
  await waitText('is still used by');
  check('Subject in use cannot be deleted', true);
  await click('dialog[open] .btn-secondary');

  await (await page.$('button[aria-label="Delete subject Software Engineering"]')).click();
  await click('dialog[open] .btn-danger');
  await waitText('Deleted “Software Engineering”');
  check('Delete unused subject', (await count('.subject-card')) === 4);
  await shot('app-07-subjects');

  // --- Dark mode + mobile ---
  await page.goto(`${BASE}/`);
  await waitText('Recent files');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await sleep(200);
  await shot('app-08-dashboard-dark');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto(`${BASE}/assignments`);
  await page.waitForSelector('.assignment-card');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check('No horizontal scroll on mobile', !overflow);
  await shot('app-09-mobile-assignments');
  await click('.menu-toggle');
  await sleep(700); // let the menu sheet finish its spring before the screenshot
  await page.screenshot({ path: `${SHOTS}/app-10-mobile-menu.png` });
  await page.setViewport({ width: 1366, height: 860 });

  // --- Sign out + protected routes ---
  await page.goto(`${BASE}/`);
  await waitText('Recent files');
  await page.locator('button.nav-button::-p-text(Sign out)').click();
  await page.waitForSelector('#login-email');
  await page.goto(`${BASE}/assignments`);
  await page.waitForSelector('#login-email');
  check('Logout + protected route redirect', page.url().endsWith('/login'));

  // --- Forgot password: reset with a code, then sign in with the new password ---
  await fill('#login-email', 'rohit@college.edu');
  await click('a.field-link');
  await page.waitForSelector('#reset-email');
  check('Forgot password link carries the email over', (await page.$eval('#reset-email', (e) => e.value)) === 'rohit@college.edu');
  await click('button[type=submit]');
  await page.waitForSelector('#reset-code');
  await fill('#reset-code', '123456');
  await fill('#reset-password', 'weak');
  await fill('#reset-confirm', 'weak');
  await click('button[type=submit]');
  await waitText('does not meet all the requirements');
  await fill('#reset-password', 'NewPassw0rd');
  await fill('#reset-confirm', 'NewPassw0rd');
  await click('button[type=submit]');
  await waitText('Password changed');
  await login('rohit@college.edu', 'Passw0rd');
  await waitText('Incorrect email or password.');
  await fill('#login-password', 'NewPassw0rd');
  await click('button[type=submit]');
  await waitText('Recent files', 10000);
  check('Password reset: the old password stops working and the new one signs in', true);
  await page.locator('button.nav-button::-p-text(Sign out)').click();
  await page.waitForSelector('#login-email');

  // --- Second user isolation ---
  await register('student.b@college.edu', 'Passw0rd');
  await login('student.b@college.edu', 'Passw0rd');
  await waitText('Recent files', 10000);
  await page.goto(`${BASE}/assignments`);
  await page.waitForSelector('.assignment-card');
  const bText = await text();
  check('User B cannot see user A data', !bText.includes('Mini Project'));

  // Direct API attempt: B tries to read one of A's assignments via the demo backend
  const isolation = await page.evaluate(async () => {
    const mod = await import('/src/services/demo/demoBackend.js');
    const backend = mod.getDemoBackend();
    const users = JSON.parse(localStorage.getItem('scm.demo.users'));
    const a = users['rohit@college.edu'].userId;
    const b = users['student.b@college.edu'].userId;
    const listA = await backend.request('GET', '/assignments', undefined, mod.DEMO_TOKEN_PREFIX + a);
    const id = listA.body.data[0].assignmentId;
    const asB = await backend.request('GET', `/assignments/${id}`, undefined, mod.DEMO_TOKEN_PREFIX + b);
    const delAsB = await backend.request('DELETE', `/assignments/${id}`, undefined, mod.DEMO_TOKEN_PREFIX + b);
    return [asB.status, delAsB.status];
  });
  check('User B gets 404 for A’s assignment (read + delete)', isolation.join() === '404,404', isolation.join());
} catch (err) {
  check('E2E run completed without exception', false, err.stack);
  await page.screenshot({ path: path.join(HERE, '.tmp', 'failure.png'), fullPage: true });
} finally {
  const relevant = errors.filter((e) => !/favicon/.test(e));
  check('No browser console errors', relevant.length === 0, relevant.slice(0, 5).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}
