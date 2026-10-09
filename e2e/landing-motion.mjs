// Motion and interaction checks for the landing page in headless Chrome: the
// Noto wordmark, the palette and Day/Night (orb colours included), the nav and
// HUD (ball, brand drawing, glider, underglow), the intro orbs, the stacking
// cards, the process timeline, in-page jumps, the AWS tiles, the scroll pin,
// the side panel, route changes, the idle animation loop and reduced motion.
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
// Start in Day on every load, whatever the machine's theme.
await page.evaluateOnNewDocument(() => localStorage.setItem('scm.theme', 'light'));
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await sleep(800);
const to = (y) => page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
const top = (sel) => page.$eval(sel, (e) => e.getBoundingClientRect().top + scrollY);
const navState = () => page.$eval('.l-nav', (e) => ({ morphed: e.classList.contains('is-morphed') }));

// 0. Wordmark: the dot drops in once and lands; scrolling spreads the letters; no yellow anywhere
const dropDone = () =>
  page.evaluate(() => document.querySelector('.l-mark-dot').getAnimations().every((a) => a.playState === 'finished'));
const landed = await page.waitForFunction(
  () => document.querySelector('.l-mark-dot').getAnimations().every((a) => a.playState === 'finished'),
  { timeout: 5000 },
).then(() => true, () => false);
check('Wordmark: the four letters rise and the dot drops in and lands', landed && (await page.$$('.l-mark-glyph')).length === 4);
await page.hover('.l-mark-dot'); await sleep(300);
check('Wordmark: the drop is one-time; pointing at the dot does not replay it', await dropDone());
await page.mouse.move(5, 450);
check('Landing: no "Create your account" button', !(await page.evaluate(() => document.querySelector('.landing').innerText.includes('Create your account'))));

// Day/Night: the switch flips the whole page and the saved theme; the orange stays;
// the intro orbs take their own colours in each theme (Day: orange + dark purple,
// Night: light orange + light purple; the merge lens grey-light by Day, grey-dark by Night)
const look = () => page.evaluate(() => {
  const cs = (sel, prop) => getComputedStyle(document.querySelector(sel))[prop];
  return {
    theme: document.documentElement.dataset.theme,
    saved: localStorage.getItem('scm.theme'),
    bg: cs('.landing', 'backgroundColor'),
    dot: cs('.l-mark-dot', 'backgroundImage'),
    pin: cs('.scroll-pin-fill', 'backgroundColor'),
    orbA: cs('.l-orb.is-a > .l-orb-skin', 'backgroundImage'),
    orbB: cs('.l-orb.is-b > .l-orb-skin', 'backgroundImage'),
    lens: cs('.l-orb-lens', 'backgroundImage'),
  };
});
const day = await look();
await page.click('.l-nav-primary .l-nav-actions .l-theme'); await sleep(1000);
const night = await look();
check('Theme: the switch turns Day into Night (page and saved choice)',
  day.theme === 'light' && night.theme === 'dark' && night.saved === 'dark' && day.bg !== night.bg, `${day.bg} → ${night.bg}`);
check('Theme: the Noto orange (wordmark dot, scroll pin) is the same in both', day.dot === night.dot && day.pin === night.pin && day.pin === 'rgb(255, 107, 53)');
check('Orbs: Day is Noto orange + dark purple, Night light orange + light purple',
  day.orbA.includes('255, 107, 53') && day.orbB.includes('45, 27, 78') && night.orbA.includes('255, 195, 163') && night.orbB.includes('211, 195, 255'));
check('Orbs: the merge is a light purplish grey by Day and a dark one by Night',
  day.lens.includes('220, 213, 230') && night.lens.includes('39, 32, 48'));
await page.click('.l-nav-primary .l-nav-actions .l-theme'); await sleep(1000);
check('Theme: switching back restores Day', (await look()).bg === day.bg);
const yellow = await page.evaluate(() => {
  const props = ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke', 'outlineColor'];
  return [...document.querySelectorAll('.landing, .landing *')].filter((el) => {
    const cs = getComputedStyle(el);
    return props.some((p) => cs[p] === 'rgb(255, 230, 0)') || cs.backgroundImage.includes('255, 230, 0');
  }).length;
});
check('Palette: no Noto yellow left on the landing page', yellow === 0, `${yellow} element(s)`);

// 1. Nav: the ball alone at the top, the HUD after 50px, the brand draws itself after 160px
const brandShown = () => page.$eval('.l-capsule .l-hud-brand', (e) => e.classList.contains('is-shown'));
let s = await navState();
check('Nav: wide bar at the top, the orange ball alone (no "Noto")',
  !s.morphed && !(await page.$eval('.l-nav-primary .l-hud-brand', (e) => e.classList.contains('is-shown'))));
await to(100); await sleep(700); s = await navState();
check('Nav: the HUD after 50px, still only the ball', s.morphed && !(await brandShown()));
await to(300); await sleep(1500);
check('Nav: after a little more scrolling the small "Noto" draws itself in', await brandShown());
const spread = await page.$eval('.l-mark', (e) => +e.style.getPropertyValue('--p'));
const glyphOpacity = await page.$eval('.l-mark-glyph', (e) => +getComputedStyle(e).opacity);
check('Wordmark: scrolling the hero away spreads the letters and fades them, with no clipping',
  spread > 0.2 && glyphOpacity < 1 && (await page.$eval('.l-mark-mask', (e) => getComputedStyle(e).clipPath)) === 'none',
  `--p ${spread.toFixed(2)}, opacity ${glyphOpacity.toFixed(2)}`);
const glider = async (sel) => {
  await page.hover(sel); await sleep(700);
  return page.evaluate((q) => {
    const g = document.querySelector('.l-pill-glider').getBoundingClientRect();
    const l = document.querySelector(q).getBoundingClientRect();
    return document.querySelector('.l-pill').classList.contains('has-glider') && Math.abs(g.left - l.left) < 2 && Math.abs(g.width - l.width) < 2;
  }, sel);
};
check('Nav: the glider slides under the hovered link', await glider('.l-pill .l-nav-link[href="#aws"]'));
await page.mouse.move(700, 600);
const glows = await page.$$eval('.l-underglow', (els) => els.filter((e) => getComputedStyle(e).boxShadow !== 'none').length);
check('Nav: Sign in and Create account glow', glows >= 4, `${glows} glowing`);

// 2. Intro: the words resolve; the orbs carry aligned negative copies of the statement
const intro = await top('.l-intro'); const introH = await page.$eval('.l-intro', (e) => e.offsetHeight);
await to(intro); await sleep(900);
const t0 = await page.$eval('.l-intro', (e) => +e.style.getPropertyValue('--t'));
await to(intro + (introH - 900)); await sleep(1200);
const words = await page.$$eval('.l-word', (els) => els.map((w) => +getComputedStyle(w).opacity));
const t1 = await page.$eval('.l-intro', (e) => +e.style.getPropertyValue('--t'));
check('Intro: words start dim and end at full ink', t0 < 0.05 && t1 > 0.99 && words.every((o) => o > 0.99), `t ${t0.toFixed(2)} → ${t1.toFixed(2)}, min word opacity ${Math.min(...words).toFixed(2)}`);
await to(intro + (introH - 900) * 0.35); await sleep(1200);
const aligned = await page.evaluate(() => {
  const real = document.querySelector('.l-intro-stage > .l-intro-text .l-word').getBoundingClientRect();
  return [...document.querySelectorAll('.l-orb-copy .l-word:first-child')].map((w) => {
    const r = w.getBoundingClientRect();
    return Math.max(Math.abs(r.left - real.left), Math.abs(r.top - real.top));
  });
});
check('Intro: each orb and the lens carry a copy of the statement aligned with the real one', aligned.length === 3 && aligned.every((d) => d < 1.5), aligned.map((d) => d.toFixed(2)).join(', '));
const proc = await top('.l-process'); const procH = await page.$eval('.l-process', (e) => e.offsetHeight);

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
check('Cards: deck ends at 0.90, 0.92 … and the purple card at 1.00', Math.abs(prev[0] - 0.9) < 0.005 && Math.abs(prev[5] - 1) < 0.005, prev.map((v) => v.toFixed(2)).join(' '));

// 4. Process: active step follows scroll, the line lands on the active dot
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
await to(3000); await sleep(800);
await page.click('.l-nav-secondary .l-nav-cta'); await page.waitForSelector('#register-email'); await sleep(300);
check('Route change: the next page opens at the top', (await page.evaluate(() => scrollY)) === 0);

// 8. Anchor links land on their section; "Under the hood" never stops in "How it works"
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(500);
await page.click('.l-nav-links a[href="#how"]'); await sleep(1800);
const howTop = await page.$eval('#how', (e) => e.getBoundingClientRect().top);
check('Anchor: "How it works" lands on its section', Math.abs(howTop) < 4, `${howTop.toFixed(1)}px`);
await to(0); await sleep(600);
await page.click('.l-nav-links a[href="#aws"]');
let seenHow = 0;
for (let i = 0; i < 40; i++) {
  seenHow += await page.evaluate(() => {
    const how = document.getElementById('how').getBoundingClientRect();
    return how.top < innerHeight - 1 && how.bottom > 1 && +getComputedStyle(document.getElementById('l-main')).opacity > 0.25 ? 1 : 0;
  });
  await sleep(40);
}
const awsTop = await page.$eval('#aws', (e) => e.getBoundingClientRect().top);
check('Anchor: "Under the hood" goes straight to Built on AWS, never through How it works', seenHow === 0 && Math.abs(awsTop) < 4, `${seenHow} frames in How it works, lands at ${awsTop.toFixed(1)}px`);

// 8b. Built on AWS: the glows live inside the tiles only
const tiles = await page.$$eval('.l-aws-card', (els) => els.map((e) => getComputedStyle(e).overflow + '/' + getComputedStyle(e, '::before').backgroundImage.includes('radial-gradient')));
check('AWS: four tiles clip their own glows, no free-floating orbs', tiles.length === 4 && tiles.every((t) => t === 'hidden/true') && !(await page.$('.l-lens')), tiles.join(' '));

// 8c. The scroll pin replaces the scrollbar and scrolls on click
await page.addStyleTag({ content: '.scroll-pin{pointer-events:auto!important}' }); // headless reports a coarse pointer
const widths = await page.evaluate(() => [innerWidth, document.documentElement.clientWidth]);
await page.mouse.click(widths[0] - 7, 450); await sleep(400);
const pinScroll = await page.evaluate(() => scrollY / (document.documentElement.scrollHeight - innerHeight));
check('Scroll pin: no browser scrollbar, a click halfway down scrolls halfway', widths[0] === widths[1] && Math.abs(pinScroll - 0.5) < 0.02, `scrollbar ${widths[0] - widths[1]}px, at ${pinScroll.toFixed(2)}`);

// 9. Reduced motion
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(800);
const rm = await page.evaluate(() => ({
  steps: document.querySelectorAll('.l-step.is-active').length,
  words: Math.min(...[...document.querySelectorAll('.l-word')].map((w) => +getComputedStyle(w).opacity)),
  sticky: getComputedStyle(document.querySelector('.l-card')).position,
  procH: document.querySelector('.l-process').offsetHeight,
  mark: getComputedStyle(document.querySelector('.l-mark-glyph')).animationName + '/' + getComputedStyle(document.querySelector('.l-mark-dot')).animationName,
}));
check('Reduced motion: all steps open, words at full ink, nothing pinned, the wordmark still', rm.steps === 4 && rm.words > 0.99 && rm.sticky !== 'sticky' && rm.procH < 2000 && rm.mark === 'none/none', JSON.stringify(rm));

check('No console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const passed = results.filter(Boolean).length;
console.log(`
${passed}/${results.length} motion checks passed`);
process.exit(passed === results.length ? 0 : 1);
