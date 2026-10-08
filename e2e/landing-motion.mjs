// Motion and interaction checks for the landing page in headless Chrome: the
// nav states, the scroll-scrubbed intro, the stacking cards, the process
// timeline, the side panel, scroll position on route changes, the idle
// animation loop and reduced motion.
// Usage:  (terminal 1) cd frontend && npm run dev
//         (terminal 2) node e2e/landing-motion.mjs
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

const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await sleep(800);
const to = (y) => page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
const top = (sel) => page.$eval(sel, (e) => e.getBoundingClientRect().top + scrollY);
const navState = () => page.$eval('.l-nav', (e) => ({ morphed: e.classList.contains('is-morphed'), dark: e.classList.contains('is-dark') }));

// 1. Nav
let s = await navState(); check('Nav: wide bar at the top', !s.morphed && !s.dark);
await to(120); await sleep(300); s = await navState(); check('Nav: capsule after 50px', s.morphed && !s.dark);
const intro = await top('.l-intro'); const introH = await page.$eval('.l-intro', (e) => e.offsetHeight);
await to(intro + 300); await sleep(300); s = await navState(); check('Nav: light-on-dark over the intro slab', s.dark);
await to(await top('.l-about') + 200); await sleep(300); s = await navState(); check('Nav: back to light over the page', !s.dark);
const proc = await top('.l-process'); const procH = await page.$eval('.l-process', (e) => e.offsetHeight);
await to(proc + 400); await sleep(300); s = await navState(); check('Nav: light-on-dark over the process slab', s.dark);

// 2. Intro resolve + slab
await to(intro); await sleep(900);
const t0 = await page.$eval('.l-intro', (e) => +e.style.getPropertyValue('--t'));
await to(intro + (introH - 900)); await sleep(1200);
const words = await page.$$eval('.l-word', (els) => els.map((w) => +getComputedStyle(w).opacity));
const t1 = await page.$eval('.l-intro', (e) => +e.style.getPropertyValue('--t'));
check('Intro: words start dim and end at full ink', t0 < 0.05 && t1 > 0.99 && words.every((o) => o > 0.99), `t ${t0.toFixed(2)} → ${t1.toFixed(2)}, min word opacity ${Math.min(...words).toFixed(2)}`);
await to(intro + introH); await sleep(1200);
const w = await page.$eval('.l-intro', (e) => e.style.getPropertyValue('--w'));
check('Intro: slab pulls in to 95% as it leaves', Math.abs(parseFloat(w) - 95) < 0.2, w);

// 3. Feature cards: scale only ever shrinks while scrolling down, ends at 0.90 … 1.00
const cards = await top('.l-cards');
let monotonic = true; let prev = null;
for (let y = cards - 900; y < cards + 1400; y += 40) {
  await to(y); await sleep(40);
  const sc = await page.$$eval('.l-card', (els) => els.map((c) => +(c.style.getPropertyValue('--scale') || 1)));
  if (prev && sc.some((v, i) => v > prev[i] + 1e-3)) monotonic = false;
  prev = sc;
}
check('Cards: scale never grows back while scrolling down', monotonic);
check('Cards: deck ends at 0.90, 0.92 … and the volt card at 1.00', Math.abs(prev[0] - 0.9) < 0.005 && Math.abs(prev[5] - 1) < 0.005, prev.map((v) => v.toFixed(2)).join(' '));

// 4. Process: active step follows scroll, volt line lands on the active dot
for (let i = 0; i < 4; i++) {
  await to(proc + ((i + 0.5) / 4) * (procH - 900)); await sleep(1100);
  const r = await page.evaluate(() => {
    const wrap = document.querySelector('.l-steps-wrap');
    const steps = [...document.querySelectorAll('.l-step')];
    const active = steps.findIndex((st) => st.classList.contains('is-active'));
    const dot = steps[active].querySelector('.l-step-dot').getBoundingClientRect();
    const fill = document.querySelector('.l-track-fill').getBoundingClientRect();
    return { active, gap: Math.abs(fill.bottom - (dot.top + dot.height / 2)), opened: steps.filter((st) => st.classList.contains('is-active')).length, wrapTop: wrap.getBoundingClientRect().top };
  });
  check(`Process: step ${i + 1} open, line on its dot`, r.active === i && r.opened === 1 && r.gap < 2, `active ${r.active}, gap ${r.gap.toFixed(1)}px`);
}

// 5. Idle: the shared loop stops when nothing moves
await sleep(1500);
const frames = await page.evaluate(() => new Promise((resolve) => {
  let n = 0; const orig = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => { n++; return orig(cb); };
  setTimeout(() => { window.requestAnimationFrame = orig; resolve(n); }, 1000);
}));
check('Idle: no animation frames requested while nothing moves', frames === 0, `${frames} frames in 1 s`);

// 6. Dialog: keyboard open, Escape closes, focus returns
await to(await top('.l-app')); await sleep(400);
await page.focus('.l-row'); await page.keyboard.press('Enter'); await sleep(500);
const open = await page.$eval('.l-popup', (d) => d.open);
const inDialog = await page.evaluate(() => !!document.activeElement.closest('.l-popup'));
await page.keyboard.press('Escape'); await sleep(500);
const back = await page.evaluate(() => document.activeElement.classList.contains('l-row') && !document.querySelector('.l-popup').open);
check('Panel: opens from the keyboard with focus inside, Escape closes it and focus returns', open && inDialog && back);

// 7. Leaving a scrolled landing page starts the next page at the top
await to(3000); await sleep(400);
await page.click('.l-nav-pill-cta'); await page.waitForSelector('#register-email'); await sleep(300);
check('Route change: the next page opens at the top', (await page.evaluate(() => scrollY)) === 0);

// 8. Anchor link lands on its section
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(500);
await page.click('.l-nav-links a[href="#how"]'); await sleep(1800);
const howTop = await page.$eval('#how', (e) => e.getBoundingClientRect().top);
check('Anchor: "How it works" scrolls to its section', Math.abs(howTop) < 4, `${howTop.toFixed(1)}px`);

// 9. Reduced motion
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(800);
const rm = await page.evaluate(() => ({
  steps: document.querySelectorAll('.l-step.is-active').length,
  words: Math.min(...[...document.querySelectorAll('.l-word')].map((w) => +getComputedStyle(w).opacity)),
  sticky: getComputedStyle(document.querySelector('.l-card')).position,
  procH: document.querySelector('.l-process').offsetHeight,
}));
check('Reduced motion: all steps open, words at full ink, nothing pinned', rm.steps === 4 && rm.words > 0.99 && rm.sticky !== 'sticky' && rm.procH < 2000, JSON.stringify(rm));

check('No console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const passed = results.filter(Boolean).length;
console.log(`
${passed}/${results.length} motion checks passed`);
process.exit(passed === results.length ? 0 : 1);
