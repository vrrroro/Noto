// Screenshots of the app in Day and Night, for the landing page's "Inside the app"
// section (frontend/src/assets/landing/<screen>-<light|dark>.webp, 1100x693 WebP).
// It registers a demo account (rohit@college.edu) in each theme, so it needs a
// dev server in DEMO MODE (the VITE_* variables empty), for example:
//   (terminal 1, Git Bash) cd frontend && VITE_AWS_REGION= VITE_COGNITO_USER_POOL_ID= VITE_COGNITO_CLIENT_ID= VITE_API_URL= npx vite --port 5174
//   (terminal 2) node e2e/app-screens.mjs frontend/src/assets/landing --webp
// Without --webp it writes 1440x907 PNGs for review instead.
// Env: E2E_BASE_URL (default http://localhost:5174), CHROME_PATH.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [out, flag] = process.argv.slice(2);
const webp = flag === '--webp';
const BASE = process.env.E2E_BASE_URL || 'http://localhost:5174';
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];

for (const theme of ['light', 'dark']) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 907, deviceScaleFactor: webp ? 1100 / 1440 : 1 });
  await page.evaluateOnNewDocument((t) => localStorage.setItem('scm.theme', t), theme);
  const fill = (s, v) => page.locator(s).fill(v);
  const shot = async (name) => {
    await page.waitForFunction(() => !document.getElementById('boot-loader'));
    await page.evaluate(() => { document.querySelectorAll('.toast-close').forEach((b) => b.click()); scrollTo(0, 0); });
    await sleep(1200);
    await page.screenshot(webp ? { path: `${out}/${name}-${theme}.webp`, type: 'webp', quality: 82 } : { path: `${out}/${theme}-${name}.png` });
  };

  await page.goto(`${BASE}/login`);
  await page.waitForSelector('#login-email');
  if (!webp) await shot('login');

  await page.goto(`${BASE}/register`);
  await fill('#register-name', 'Rohit Sharma');
  await fill('#register-email', 'rohit@college.edu');
  await fill('#register-password', 'Passw0rd');
  await fill('#register-confirm', 'Passw0rd');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('#confirm-code');
  await fill('#confirm-code', '123456');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('#login-email');
  await fill('#login-email', 'rohit@college.edu');
  await fill('#login-password', 'Passw0rd');
  await page.locator('button[type=submit]').click();
  await page.waitForSelector('.next-card');

  for (const [name, path, ready] of [
    ['dashboard', '/', '.next-card'],
    ['assignments', '/assignments', '.assignment-card'],
    ['notes', '/notes', '.file-card'],
    ['subjects', '/subjects', '.subject-card'],
  ]) {
    await page.goto(`${BASE}${path}`);
    await page.waitForSelector(ready);
    await shot(name);
  }
  await ctx.close();
}
console.log('errors:', errors.join(' | ') || 'none');
await browser.close();
