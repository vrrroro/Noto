// The first-load intro for the hero's orange dot: the Noto wordmark rises in
// grey (the rest of the page is in colour), the dot falls like a drop of
// water and bounces with real physics: gravity, a squash while it is in
// contact (longer for harder hits), a stretch while it flies, energy lost on
// every bounce, and a short wobble as it settles. Only once it has finished
// bouncing and lies still does one slow ripple spread from it across the word
// and give the letters their colour back, the same circle reveal as the
// Day/Night switch. About three seconds.
//
// The grey is a copy of the four letters laid exactly over the real ones
// (same classes, so they rise in step), greyed with a filter, with a hole in
// its mask that grows from the dot until the copy is gone. It plays once per
// page load, never under reduced motion (NotoMark only calls it when motion
// is allowed).

const START_DELAY = 250; // ms: the letters are part-way up when the dot falls
const FALL_S = 0.3; // seconds from above the screen to the baseline
const RESTITUTION = 0.36; // share of the speed kept by each bounce
const STOP_SPEED = 110; // px/s: slower than this and the dot stays down
const MAX_SQUASH = 0.38; // squash on the first, hardest impact
const MAX_STRETCH = 0.22; // stretch at full falling speed
const WOBBLE = { k: 900, c: 19 }; // the shape's spring after each launch and at rest
// The ripple: the Day/Night switch's circle reveal (switchTheme), from the
// dot. It starts once the dot has stopped bouncing and spreads slowly, so the
// word takes its colour back gently.
const RIPPLE = { duration: 1500, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' };

let played = false;

export function playDropIntro(dot) {
  if (played || !dot) return () => {};
  played = true;

  // The grey copy of the letters, over the real ones.
  const word = dot.parentElement;
  const overlay = document.createElement('span');
  overlay.className = 'l-mark-mono';
  overlay.setAttribute('aria-hidden', 'true');
  const originals = [...word.querySelectorAll('.l-mark-mask')];
  for (const mask of originals) overlay.append(mask.cloneNode(true));
  word.append(overlay);
  // The copies' rise must run on the same clock as the real letters' (theirs
  // may start a frame or a remount later): pairs of [real, copy] animations.
  const pairs = () =>
    originals.flatMap((mask, i) => {
      const copy = overlay.children[i];
      const real = [mask, mask.firstElementChild].flatMap((e) => e.getAnimations());
      const mine = [copy, copy.firstElementChild].flatMap((e) => e.getAnimations());
      return real.map((a, j) => [a, mine[j]]).filter(([, b]) => b);
    });
  let synced = false;
  function sync() {
    let all = true;
    for (const [a, b] of pairs()) {
      if (a.startTime == null) all = false;
      else if (b.startTime !== a.startTime) b.startTime = a.startTime;
    }
    synced = all;
  }

  // Everything is measured from the dot's bottom edge at rest (the floor),
  // re-read every frame so a late web font or a scroll cannot leave the
  // holes behind. y is the dot's offset from the floor (negative is up).
  const first = dot.getBoundingClientRect();
  const height = first.bottom + first.height + 40; // starts fully above the screen
  const g = (2 * height) / FALL_S ** 2;
  const v0 = g * FALL_S; // speed at the first impact
  const s = { y: -height, v: 0, phase: 'wait', contact: 0, contactTime: 0, amp: 0, launch: 0, sq: 0, sv: 0 };
  const applied = { y: -height, sx: 1, sy: 1 };
  let ripple = null;
  let raf = 0;
  let started = 0;
  let previous = 0;
  let finished = false;

  function apply(y, sx, sy) {
    dot.style.translate = `0 ${y.toFixed(2)}px`;
    dot.style.scale = `${sx.toFixed(4)} ${sy.toFixed(4)}`;
    applied.y = y;
    applied.sx = sx;
    applied.sy = sy;
  }
  apply(s.y, 1, 1);

  // x, y: the dot's centre on screen; the ripple grows until it covers the copy.
  function startRipple(x, y) {
    const box = overlay.getBoundingClientRect();
    x -= box.left;
    y -= box.top;
    const radius = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 8;
    overlay.style.setProperty('--rx', `${x.toFixed(1)}px`);
    overlay.style.setProperty('--ry', `${y.toFixed(1)}px`);
    ripple = overlay.animate({ '--l-r': ['0px', `${radius.toFixed(0)}px`] }, { ...RIPPLE, fill: 'forwards' });
    ripple.finished.then(() => overlay.remove()).catch(() => {});
  }

  function step(dt) {
    if (s.phase === 'air') {
      s.v += g * dt;
      s.y += s.v * dt;
      if (s.y >= 0) {
        // Impact: hold on the floor and squash; harder hits squash more and longer.
        const speed = s.v;
        s.y = 0;
        s.phase = 'contact';
        s.contact = 0;
        s.amp = MAX_SQUASH * (speed / v0) ** 0.75;
        s.contactTime = 0.05 + 0.07 * (speed / v0);
        s.launch = speed * RESTITUTION;
        s.sq = 0;
        s.sv = 0;
        return;
      }
    } else if (s.phase === 'contact') {
      s.contact += dt;
      const t = Math.min(1, s.contact / s.contactTime);
      s.sq = s.amp * Math.sin(Math.PI * t);
      if (t >= 1) {
        // Spring back: a little overshoot into a stretch as it leaves.
        s.sq = 0;
        s.sv = (-s.amp * Math.PI) / s.contactTime * 0.45;
        if (s.launch < STOP_SPEED) {
          s.phase = 'rest';
          s.v = 0;
        } else {
          s.phase = 'air';
          s.v = -s.launch;
        }
      }
    }
    if (s.phase === 'air' || s.phase === 'rest') {
      const a = -WOBBLE.k * s.sq - WOBBLE.c * s.sv;
      s.sv += a * dt;
      s.sq += s.sv * dt;
    }
  }

  function frame(now) {
    raf = 0;
    if (!started) {
      started = now;
      previous = now;
    }
    const dt = Math.min(1 / 30, (now - previous) / 1000);
    previous = now;
    if (s.phase === 'wait' && now - started >= START_DELAY) s.phase = 'air';
    if (!synced) sync();

    // Read: where the floor is now (the applied translate moves the bottom
    // edge; the scale is anchored there, so it does not).
    const r = dot.getBoundingClientRect();
    const floor = r.bottom - applied.y;
    const cx = r.left + r.width / 2;
    const h = r.height / applied.sy;

    // Small fixed steps keep the bounces the same at any frame rate.
    for (let left = dt; left > 1e-6; left -= 1 / 240) step(Math.min(left, 1 / 240));

    const stretch = s.phase === 'air' ? MAX_STRETCH * Math.min(1, Math.abs(s.v) / v0) : 0;
    const sx = 1 + s.sq - stretch * 0.45;
    const sy = 1 - s.sq * 0.9 + stretch;
    apply(s.y, sx, sy);

    // Still at last: the bouncing is over, and the colour comes back from the dot.
    const settled = s.phase === 'rest' && Math.abs(s.sq) < 0.002 && Math.abs(s.sv) < 0.05;
    if (settled) {
      finished = true;
      dot.style.removeProperty('translate');
      dot.style.removeProperty('scale');
      startRipple(cx, floor - h / 2);
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // Unmounted part-way (a route change, or React's development double mount):
  // put everything back and let the next mount play it from the start.
  return () => {
    if (finished && (!ripple || ripple.playState === 'finished')) return;
    cancelAnimationFrame(raf);
    ripple?.cancel();
    overlay.remove();
    dot.style.removeProperty('translate');
    dot.style.removeProperty('scale');
    played = false;
  };
}
