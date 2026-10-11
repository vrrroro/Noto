// Layout checks across screen shapes in headless Chrome (demo mode): phones
// (320 to 430 wide), a phone held sideways, tablets both ways, a short
// laptop, a square screen and an ultra-wide. On every shape, the landing page
// and each app page must not scroll sideways; plus a few shape-specific checks.
// Usage:  (terminal 1) cd frontend && npm run dev   (demo mode: VITE_* empty)
//         (terminal 2) node e2e/responsive.mjs
// Env:    E2E_BASE_URL (default http://localhost:5173), CHROME_PATH (auto-detected)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

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

const SHAPES = [
  ['phone 320', 320, 568, true],
  ['phone 360', 360, 740, true],
  ['phone 390', 390, 844, true],
  ['phone 430', 430, 932, true],
  ['phone sideways', 844, 390, true],
  ['tablet', 768, 1024, true],
  ['tablet sideways', 1024, 768, false],
  ['short laptop', 1280, 600, false],
  ['square', 1000, 1000, false],
  ['ultra-wide', 2560, 1080, false],
];
const PAGES = [
  ['landing', '/home'],
  ['dashboard', '/'],
  ['assignments', '/assignments'],
  ['subjects', '/subjects'],
  ['notes', '/notes'],
];

const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

try {
  // A demo account, made straight through the demo auth module (the UI
  // sign-up is covered by run.mjs).
  await page.setViewport({ width: 1366, height: 860 });
  await page.goto(`${BASE}/login`);
  await page.evaluate(async () => {
    localStorage.setItem('scm.theme', 'light');
    const { demoAuth } = await import('/src/services/demo/demoAuth.js');
    await demoAuth.signUp('shapes@college.edu', 'Passw0rd', 'Rohit Sharma');
    await demoAuth.confirmSignUp('shapes@college.edu', '123456');
    await demoAuth.signIn('shapes@college.edu', 'Passw0rd');
  });

  // 1. No sideways scroll anywhere.
  for (const [pageName, path] of PAGES) {
    const wide = [];
    for (const [shape, width, height, mobile] of SHAPES) {
      await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
      await page.goto(BASE + path, { waitUntil: 'networkidle0' });
      await sleep(pageName === 'landing' ? 1500 : 600);
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (scrollW > 0) wide.push(`${shape} +${scrollW}px`);
    }
    check(`${pageName}: no sideways scroll on any of ${SHAPES.length} screen shapes`, wide.length === 0, wide.join(', '));
  }

  // 2. Landing: the two nav islands never touch, from 992px (where they
  // start) up; scrolled, so the brand in the centre island is whole. The
  // capsule is centred on the screen wherever there is room (1280 up).
  const touching = [];
  const offCentre = [];
  for (const width of [992, 1024, 1280, 1359, 1360, 1440, 1920]) {
    await page.setViewport({ width, height: 800 });
    await page.goto(`${BASE}/home`);
    await sleep(600);
    await page.evaluate(() => scrollTo(0, 1500));
    await sleep(1500);
    const { gap, off } = await page.evaluate(() => {
      const a = document.querySelector('.l-capsule').getBoundingClientRect();
      const b = document.querySelector('.l-nav-islands .l-nav-actions').getBoundingClientRect();
      return { gap: Math.round(b.left - a.right), off: Math.round(a.left + a.width / 2 - document.documentElement.clientWidth / 2) };
    });
    if (gap < 24) touching.push(`${width}px: ${gap}px`);
    if (width >= 1280 && Math.abs(off) > 1) offCentre.push(`${width}px: ${off}px`);
  }
  check('Landing: the nav islands keep a clear gap at every desktop width', touching.length === 0, touching.join(', '));
  check('Landing: the nav capsule is centred on the screen from 1280px up', offCentre.length === 0, offCentre.join(', '));

  // 3. Landing hero: the whole wordmark is on the first screen, in every shape.
  const cut = [];
  for (const [shape, width, height, mobile] of SHAPES) {
    await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile });
    await page.goto(`${BASE}/home`, { waitUntil: 'networkidle0' });
    await sleep(2600);
    // The glyphs' boxes carry extra padding under them (for the gradient);
    // their visible ink ends at the box minus that padding.
    const bottom = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.l-mark-glyph, .l-mark-dot')].map((e) => e.getBoundingClientRect().bottom - parseFloat(getComputedStyle(e).paddingBottom))));
    if (bottom > height + 1) cut.push(`${shape} ${Math.round(bottom)} > ${height}`);
  }
  check('Landing: the hero wordmark fits the first screen in every shape', cut.length === 0, cut.join(', '));

  // 4. Landing, phone held sideways: the open "How it works" step shows its text.
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle0' });
  await sleep(1200);
  await page.evaluate(() => {
    const p = document.querySelector('.l-process');
    scrollTo(0, p.getBoundingClientRect().top + scrollY + p.offsetHeight * 0.1);
  });
  await sleep(1500);
  const stepText = await page.evaluate(() => {
    const body = document.querySelector('.l-step.is-active .l-step-body p');
    if (!body) return null;
    const r = body.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), opacity: getComputedStyle(body.closest('.l-step-body')).opacity };
  });
  check('Landing, phone sideways: the open step\'s text is on screen', stepText && stepText.bottom <= 390 && stepText.top > 0 && stepText.opacity === '1', JSON.stringify(stepText));

  // 5. App, tablet: the floating bar keeps its own height on a short page.
  await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/notes`, { waitUntil: 'networkidle0' });
  await sleep(800);
  const bar = await page.evaluate(() => Math.round(document.querySelector('.sidebar').getBoundingClientRect().height - document.querySelector('.sidebar-top').getBoundingClientRect().height));
  check('App, tablet: the top bar is no taller than itself on a short page', bar <= 2, `${bar}px extra`);

  // 6. App, ultra-wide: the panel and the page stay together.
  await page.setViewport({ width: 2560, height: 1080 });
  await page.goto(`${BASE}/assignments`, { waitUntil: 'networkidle0' });
  await sleep(800);
  const apart = await page.evaluate(() => Math.round(document.querySelector('.page').getBoundingClientRect().left - document.querySelector('.sidebar').getBoundingClientRect().right));
  check('App, ultra-wide: the page sits next to the panel', apart < 120, `${apart}px apart`);

  check('No page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (err) {
  check('Responsive run finished', false, err.message);
} finally {
  await browser.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} responsive checks passed`);
process.exit(passed === results.length ? 0 : 1);
