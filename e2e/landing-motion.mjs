// Motion and interaction checks for the landing page in headless Chrome: the
// first-load intro (grey wordmark, falling dot, colour ripple), the Noto wordmark,
// the palette and Day/Night (orb colours included), the nav and
// island nav (bare at the top, glass on scroll, brand that plays once the hero wordmark is off screen, glider, underglow), the intro orbs, the stacking
// cards, the process timeline, in-page jumps, the AWS tiles, the scroll pin,
// the inline app details, route changes, the idle animation loop and reduced motion.
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
// Watches the first-load intro on every frame of each load: the grey copy of
// the wordmark (and whether the page itself stays in colour), the dot's fall
// and squash, when the ripple starts and its radius, and when it all ends.
await page.evaluateOnNewDocument(() => {
  const s = (window.__intro = { mono: '', pageGrey: false, minY: 0, maxSx: 1, maxR: 0, fall: 0, settled: 0, rippleAt: 0, monoGone: 0, frames: 0 });
  const tick = (now) => {
    s.frames += 1;
    const dot = document.querySelector('.l-mark-dot');
    const mono = document.querySelector('.l-mark-mono');
    if (document.querySelector('.l-mono')) s.pageGrey = true;
    if (mono && !s.mono) s.mono = getComputedStyle(mono).filter;
    if (mono && !s.rippleAt && parseFloat(getComputedStyle(mono).getPropertyValue('--l-r')) > 0) s.rippleAt = now;
    if (mono) s.maxR = Math.max(s.maxR, parseFloat(getComputedStyle(mono).getPropertyValue('--l-r')) || 0);
    if (!mono && s.mono && !s.monoGone) s.monoGone = now;
    if (dot) {
      const y = parseFloat((dot.style.translate || '0 0').split(' ')[1]) || 0;
      const sx = parseFloat(dot.style.scale) || 1;
      if (y < -innerHeight * 0.5 && y > s.minY && !s.fall && s.minY < 0) s.fall = now; // first frame it moves down
      s.minY = Math.min(s.minY, y);
      s.maxSx = Math.max(s.maxSx, sx);
      if (s.fall && !s.settled && !dot.style.translate) s.settled = now;
    }
    // Stops once it is all over (or after ~6 s, so it can never keep the page busy).
    if ((!s.settled || !s.monoGone) && s.frames < 400) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await sleep(800);
const to = (y) => page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
const top = (sel) => page.$eval(sel, (e) => e.getBoundingClientRect().top + scrollY);
const navState = () => page.$eval('.l-nav', (e) => ({ glass: e.classList.contains('is-scrolled') }));

// 0. Wordmark: the word rises in grey (the page stays in colour), the dot
// falls, squashes and settles, and only then its ripple brings the word's colour back;
// scrolling spreads the letters; no yellow anywhere
await page.waitForFunction(() => window.__intro.settled && window.__intro.monoGone, { timeout: 6000 }).catch(() => {});
const firstLoad = await page.evaluate(() => ({ ...window.__intro, word: document.querySelector('.l-mark-word').getBoundingClientRect().width }));
check('Intro: only the wordmark starts grey (a greyed copy of the letters); the page stays in colour', firstLoad.mono === 'grayscale(1)' && !firstLoad.pageGrey, firstLoad.mono);
check(
  'Intro: the dot falls from above the screen, squashes on impact and settles within 1.1 s',
  firstLoad.minY < -450 && firstLoad.maxSx > 1.2 && firstLoad.settled > 0 && firstLoad.settled - firstLoad.fall < 1100 && (await page.$$('.l-mark-glyph')).length === 4,
  `from ${firstLoad.minY.toFixed(0)}px, squash ${firstLoad.maxSx.toFixed(2)}, settled in ${(firstLoad.settled - firstLoad.fall).toFixed(0)} ms`,
);
check(
  'Intro: the word stays grey until the dot has finished bouncing; then one quick ripple (under a second) from the dot covers it and the grey copy is removed',
  firstLoad.settled > 0 && firstLoad.rippleAt >= firstLoad.settled && firstLoad.rippleAt - firstLoad.settled < 100 &&
    firstLoad.monoGone - firstLoad.rippleAt > 600 && firstLoad.monoGone - firstLoad.rippleAt < 1000 &&
    firstLoad.maxR > firstLoad.word * 0.9 && firstLoad.monoGone > 0 && !(await page.$('.l-mark-mono')),
  `ripple starts ${(firstLoad.rippleAt - firstLoad.settled).toFixed(0)} ms after the dot settles (${(firstLoad.rippleAt - firstLoad.fall).toFixed(0)} ms after the fall), takes ${(firstLoad.monoGone - firstLoad.rippleAt).toFixed(0)} ms, reaches ${firstLoad.maxR.toFixed(0)}px`,
);
await page.hover('.l-mark-dot'); await sleep(300);
check(
  'Intro: plays once; pointing at the dot does not replay it',
  await page.evaluate(() => !document.querySelector('.l-mark-mono') && !document.querySelector('.l-mark-dot').style.translate),
);
check(
  'Copy: no "student" or "project" on the page; the footer credit reads "bloomed by Rohit"',
  await page.evaluate(() => {
    const text = document.querySelector('.landing').innerText;
    return !/student|project/i.test(text) && /bloomed by rohit/i.test(text);
  }),
);
check('Nav: nothing in the top-left corner at the top of the page (the islands are centred and right)', await page.evaluate(() => document.querySelector('.l-capsule').getBoundingClientRect().left > 200 && !document.querySelector('.l-nav-primary')));
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
    inkA: cs('.l-orb.is-a', 'color'),
    inkB: cs('.l-orb.is-b', 'color'),
    inkLens: cs('.l-orb-lens', 'color'),
    page: cs('.l-intro-stage > .l-intro-text', 'color'),
  };
});
const day = await look();
await page.click('.l-capsule .l-theme'); await sleep(1000);
const night = await look();
check('Theme: the switch turns Day into Night (page and saved choice)',
  day.theme === 'light' && night.theme === 'dark' && night.saved === 'dark' && day.bg !== night.bg, `${day.bg} → ${night.bg}`);
check('Theme: the Noto orange (wordmark dot, scroll pin) is the same in both', day.dot === night.dot && day.pin === night.pin && day.pin === 'rgb(255, 107, 53)');
check('Orbs: Day is Noto orange (left) + dark purple (right); Night a lilac purple (left) + the orange (right)',
  day.orbA.includes('255, 107, 53') && day.orbB.includes('45, 27, 78') && night.orbA.includes('157, 123, 245') && night.orbB.includes('255, 107, 53'));
// The negative: the words in the orbs are white by Day and black by Night (the
// opposite of the page's ink); in the merge they are the page's ink again.
const dark = (c) => c.match(/\d+/g).slice(0, 3).every((v) => +v < 60);
const light = (c) => c.match(/\d+/g).slice(0, 3).every((v) => +v > 230);
check('Orbs: the words flip to the negative in the orbs in both themes (white by Day, black by Night), and back in the merge',
  light(day.inkA) && light(day.inkB) && dark(day.inkLens) && dark(night.inkA) && dark(night.inkB) && light(night.inkLens),
  JSON.stringify({ day: [day.inkA, day.inkB, day.inkLens], night: [night.inkA, night.inkB, night.inkLens] }));
check('Orbs: the merge is a light purplish grey by Day and a blackish gradient by Night',
  day.lens.includes('220, 213, 230') && night.lens.includes('20, 16, 25'));
await page.click('.l-capsule .l-theme'); await sleep(1000);
check('Theme: switching back restores Day', (await look()).bg === day.bg);
const yellow = await page.evaluate(() => {
  const props = ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke', 'outlineColor'];
  return [...document.querySelectorAll('.landing, .landing *')].filter((el) => {
    const cs = getComputedStyle(el);
    return props.some((p) => cs[p] === 'rgb(255, 230, 0)') || cs.backgroundImage.includes('255, 230, 0');
  }).length;
});
check('Palette: no Noto yellow left on the landing page', yellow === 0, `${yellow} element(s)`);

// 1. Nav: the islands are there from the top, bare; their glass comes in after
// 50px; the small "Noto" animates in by itself only once the hero wordmark is
// entirely off the screen (and back out when it returns); the switch is in the
// Noto island
const brand = () => page.evaluate(() => ({
  b: +getComputedStyle(document.querySelector('.l-nav')).getPropertyValue('--b') || 0,
  word: +getComputedStyle(document.querySelector('.l-capsule .l-hud-word')).opacity,
  hero: +getComputedStyle(document.querySelector('.l-mark-glyph')).opacity,
}));
let s = await navState();
const bare = await page.evaluate(() => getComputedStyle(document.querySelector('.l-capsule')).borderTopColor);
check('Nav: the islands are there at the top, bare (no glass), with only the ball',
  !s.glass && /rgba\(0, 0, 0, 0\)|transparent/.test(bare) && (await brand()).word === 0, bare);
await to(120); await sleep(800); s = await navState();
const glassLine = await page.evaluate(() => getComputedStyle(document.querySelector('.l-capsule')).borderTopColor);
check('Nav: after 50px the islands get their glass and borders', s.glass && !/rgba\(0, 0, 0, 0\)/.test(glassLine), glassLine);
// The hero wordmark faded but still on the screen: no brand yet.
const heroAt = () => page.evaluate(() => ({
  bottom: document.querySelector('.l-hero .l-mark-word').getBoundingClientRect().bottom,
  hero: +getComputedStyle(document.querySelector('.l-mark-glyph')).opacity,
}));
let fadedY = null;
for (let y = 300; y < 1600 && fadedY === null; y += 40) {
  await to(y); await sleep(250);
  const h = await heroAt();
  if (h.hero === 0 && h.bottom > 40) fadedY = y;
}
await sleep(2200);
const faded = await brand();
check('Nav: the small "Noto" waits while the hero wordmark is still on the screen (even faded)', fadedY !== null && faded.b === 0 && faded.word === 0, JSON.stringify({ fadedY, faded }));
// Off the screen: it plays by itself, with no more scrolling, and finishes.
const goneY = await page.evaluate(() => Math.ceil(document.querySelector('.l-hero .l-mark-word').getBoundingClientRect().bottom + scrollY + 40));
await to(goneY);
await sleep(450);
const early = await brand();
await sleep(850);
const done = await brand();
check('Nav: once the hero wordmark is off the screen, the small "Noto" animates in on its own (not with the scroll), in about a second',
  early.b > 0 && early.b < 0.9 && done.b === 1 && done.word === 1, JSON.stringify({ early, done }));
// Whole: the ball sits on the baseline after "Noto", as in the big logo, and
// the capsule is centred on the screen.
const placed = await page.evaluate(() => {
  const word = document.querySelector('.l-capsule .l-hud-word');
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  word.appendChild(probe);
  const baseline = probe.getBoundingClientRect().top;
  probe.remove();
  const dot = document.querySelector('.l-capsule .l-hud-dot').getBoundingClientRect();
  const cap = document.querySelector('.l-capsule').getBoundingClientRect();
  return { dotBottom: dot.bottom - baseline, centre: cap.left + cap.width / 2 - document.documentElement.clientWidth / 2 };
});
check('Nav: the small "Noto" ends with its ball on the baseline (as in the logo), in a capsule centred on the screen',
  Math.abs(placed.dotBottom) <= 1 && Math.abs(placed.centre) <= 1, JSON.stringify(placed));
// Back up until the wordmark is on the screen again: it plays back out.
await to(Math.max(0, fadedY - 200)); await sleep(2400);
const back = await brand();
check('Nav: the small "Noto" plays back out when the hero wordmark returns', back.b === 0 && back.word === 0, JSON.stringify(back));
await to(goneY); await sleep(2200);
check(
  'Nav: the Day/Night switch is in the Noto island, after "Under the hood" and a rule; the account island has none',
  await page.evaluate(() => {
    const cap = [...document.querySelector('.l-capsule').children].map((e) => e.className);
    const actions = document.querySelector('.l-nav-islands .l-nav-actions');
    return cap.at(-1).includes('l-theme') && cap.at(-2).includes('l-capsule-rule') && cap.at(-3).includes('l-pill') && !actions.querySelector('.l-theme');
  }),
);
await to(300); await sleep(1200);
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
// From the first link to the last, sampled through the slide: never past the pill or the link.
await page.hover('.l-pill .l-nav-link[href="#features"]'); await sleep(700);
await page.hover('.l-pill .l-nav-link[href="#aws"]');
let spill = 0;
for (let i = 0; i < 24; i++) {
  spill = Math.max(spill, await page.evaluate(() => {
    const g = document.querySelector('.l-pill-glider').getBoundingClientRect();
    const l = document.querySelector('.l-pill .l-nav-link[href="#aws"]').getBoundingClientRect();
    return g.right - l.right;
  }));
  await sleep(25);
}
check('Nav: the glider never overshoots past "Under the hood"', spill < 1, `${spill.toFixed(1)}px past`);
await page.mouse.move(700, 600);
// The underglow is a quarter of its first strength, and Create account is a
// soft purple tint (no bright purple) with ink text.
const buttons = await page.evaluate(() => {
  const cta = document.querySelector('.l-nav-cta');
  const alphas = [...getComputedStyle(cta).boxShadow.matchAll(/rgba?\([^)]*?([\d.]+)\)/g)].map((m) => +m[1]);
  return { glow: Math.max(...alphas.filter((a) => a < 1)), bg: getComputedStyle(cta.querySelector('.l-ib-bg')).backgroundColor, fg: getComputedStyle(cta).color };
});
check('Nav: Sign in and Create account glow softly, and Create account is a soft purple tint', buttons.glow <= 0.15 && !buttons.bg.includes('123, 47, 255)') && buttons.fg !== 'rgb(255, 255, 255)', JSON.stringify(buttons));

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
check('Cards: five cards, the deck ends at 0.90, 0.92 … and the last card at 1.00', prev.length === 5 && Math.abs(prev[0] - 0.9) < 0.005 && Math.abs(prev[4] - 1) < 0.005, prev.map((v) => v.toFixed(2)).join(' '));

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
// With step 4 open, 04 still sits at the very end of the line, the four
// steps are evenly spaced, and the open step's text and diagram sit under its
// title, clear of the next step.
const ends = await page.evaluate(() => {
  const ys = [...document.querySelectorAll('.l-step-dot')].map((d) => { const r = d.getBoundingClientRect(); return r.top + r.height / 2; });
  const track = document.querySelector('.l-track').getBoundingClientRect();
  const gaps = ys.slice(1).map((y, i) => y - ys[i]);
  return { first: Math.abs(track.top - ys[0]), last: Math.abs(track.bottom - ys[3]), spread: Math.max(...gaps) - Math.min(...gaps) };
});
check('Process: the line runs from 01 to 04, evenly spaced, with 04 at its end', ends.first < 2 && ends.last < 2 && ends.spread < 2, JSON.stringify(ends));
await to(proc + (1.5 / 4) * (procH - 900)); await sleep(1300);
const under = await page.evaluate(() => {
  const steps = [...document.querySelectorAll('.l-step')];
  const title = steps[1].querySelector('.l-step-title').getBoundingClientRect();
  const body = steps[1].querySelector('.l-step-body').getBoundingClientRect();
  const next = steps[2].querySelector('.l-step-title').getBoundingClientRect();
  return { below: Math.round(body.top - title.bottom), left: Math.round(body.left - title.left), clear: Math.round(next.top - body.bottom) };
});
check('Process: the open step text and diagram sit under its title, clear of the next step', under.below >= 0 && Math.abs(under.left) < 4 && under.clear >= 0, JSON.stringify(under));

// 5. Idle: the shared loop stops when nothing moves
await sleep(1500);
const frames = await page.evaluate(() => new Promise((resolve) => {
  let n = 0; const orig = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => { n++; return orig(cb); };
  setTimeout(() => { window.requestAnimationFrame = orig; resolve(n); }, 1000);
}));
check('Idle: no animation frames requested while nothing moves', frames === 0, `${frames} frames in 1 s`);

// 6. Inside the app: a row opens its details right under it (the next row
// moves down), Minimise closes it and focus returns to the row
await to(await top('.l-app')); await sleep(400);
const nextTop = () => page.$eval('.l-rows li:nth-child(2) .l-row', (e) => e.getBoundingClientRect().top);
const before = await nextTop();
await page.focus('.l-row'); await page.keyboard.press('Enter'); await sleep(1000);
const opened = await page.evaluate(() => ({
  expanded: document.querySelector('.l-row').getAttribute('aria-expanded'),
  height: document.querySelector('.l-detail').getBoundingClientRect().height,
  dialog: Boolean(document.querySelector('dialog, .l-popup')),
}));
const pushed = (await nextTop()) - before;
await page.click('.l-row-item.is-open .l-row'); await sleep(900);
const closed = await page.evaluate(() => ({
  expanded: document.querySelector('.l-row').getAttribute('aria-expanded'),
  height: document.querySelector('.l-detail').getBoundingClientRect().height,
  focus: document.activeElement === document.querySelector('.l-row'),
}));
check(
  'Inside the app: a row opens inline (no popup), pushing the rows below down; its own button closes it, with no Minimise button inside',
  opened.expanded === 'true' && opened.height > 200 && !opened.dialog && pushed > 200 && closed.expanded === 'false' && closed.height < 2 && closed.focus && !(await page.$('.l-detail-close')),
  `pushed ${pushed.toFixed(0)}px, detail ${opened.height.toFixed(0)}px`,
);
// Opening a lower row while an upper one is open: the upper one folds away,
// but the row you clicked stays where it is and opens downwards.
await page.click('.l-rows li:nth-child(1) .l-row'); await sleep(1000);
await page.$eval('.l-rows li:nth-child(3)', (e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(300);
const third = () => page.$eval('.l-rows li:nth-child(3) .l-row', (e) => e.getBoundingClientRect().top);
const anchor = await third();
await page.click('.l-rows li:nth-child(3) .l-row');
let drift = 0;
for (let i = 0; i < 40; i++) { drift = Math.max(drift, Math.abs((await third()) - anchor)); await sleep(20); }
check('Inside the app: switching to a lower row keeps it in place while the upper one folds', drift < 4, `${drift.toFixed(1)}px drift`);
await page.click('.l-rows li:nth-child(3) .l-row'); await sleep(800);

// 7. Leaving a scrolled landing page starts the next page at the top
await to(3000); await sleep(800);
await page.click('.l-nav-islands .l-nav-cta'); await page.waitForSelector('#register-email'); await sleep(300);
check('Route change: the next page opens at the top', (await page.evaluate(() => scrollY)) === 0);

// 8. Anchor links land on their section; "Under the hood" never stops in "How it works"
await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(500);
await page.click('.l-pill a[href="#how"]'); await sleep(1800);
const howTop = await page.$eval('#how', (e) => e.getBoundingClientRect().top);
check('Anchor: "How it works" lands on its section', Math.abs(howTop) < 4, `${howTop.toFixed(1)}px`);
await to(0); await sleep(600);
await page.click('.l-pill a[href="#aws"]');
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

// 8b. Built on AWS: one soft orange-to-purple tint inside the tiles (no orbs),
// and every tile's service name on the same line
const tiles = await page.$$eval('.l-aws-card', (els) =>
  els.map((e) => ({
    tint: getComputedStyle(e, '::before').backgroundImage,
    label: Math.round(e.querySelector('.l-aws-service').getBoundingClientRect().top),
  })),
);
check(
  'AWS: four tiles share one orange-to-purple tint (no orbs) and their headers line up',
  tiles.length === 4 && tiles.every((t) => t.tint.startsWith('linear-gradient') && !t.tint.includes('radial')) && new Set(tiles.map((t) => t.label)).size === 1,
  tiles.map((t) => t.label).join(' '),
);

// 8c. Inside the app: pointing at a row lifts it into a card with an orange
// title; the footer has no closing "Sign in" and its credit is centred
await page.$eval('#app', (e) => e.scrollIntoView({ behavior: 'instant' })); await sleep(500);
const row = await page.$eval('.l-rows li:nth-child(2) .l-row', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await page.mouse.move(row.x, row.y); await sleep(500);
const hovered = await page.$eval('.l-rows li:nth-child(2) .l-row', (e) => ({
  card: getComputedStyle(e, '::before').opacity,
  title: getComputedStyle(e.querySelector('.l-row-title')).color,
}));
check('Inside the app: a hovered row becomes a card and its title turns orange', +hovered.card > 0.99 && hovered.title === 'rgb(255, 107, 53)', JSON.stringify(hovered));
await page.mouse.move(5, 5);
const foot = await page.evaluate(() => {
  const credit = [...document.querySelectorAll('.l-footer-credits > *')][1].getBoundingClientRect();
  const box = document.querySelector('.l-footer-credits').getBoundingClientRect();
  return { cta: Boolean(document.querySelector('.l-app-cta')), off: credit.left + credit.width / 2 - (box.left + box.width / 2) };
});
check('Footer: no closing "Sign in" button, and the credit sits in the centre', !foot.cta && Math.abs(foot.off) < 2, `${foot.off.toFixed(1)}px off centre`);

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
  grey: window.__intro.mono,
  dotMoved: window.__intro.minY,
}));
check('Reduced motion: all steps open, words at full ink, nothing pinned, the wordmark still, no grey intro', rm.steps === 4 && rm.words > 0.99 && rm.sticky !== 'sticky' && rm.procH < 2000 && rm.mark === 'none/none' && !rm.grey && rm.dotMoved === 0, JSON.stringify(rm));

check('No console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const passed = results.filter(Boolean).length;
console.log(`
${passed}/${results.length} motion checks passed`);
process.exit(passed === results.length ? 0 : 1);
