import { useEffect, useState } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(REDUCED).matches);
  useEffect(() => {
    const query = matchMedia(REDUCED);
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

// Everything on the landing page that depends on scroll position:
// - panels stick once their bottom reaches the viewport bottom, so the next one slides over them;
// - the header takes the tone of the panel under it;
// - [data-reveal] elements get .is-in the first time they are seen;
// - [data-lag] headings trail the scroll and drift into place after it stops (motion only);
// - the cursor halo trails the pointer (motion + fine pointer only).
export function useLandingMotion(rootRef, motion) {
  const [tone, setTone] = useState('page');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const panels = [...root.querySelectorAll('.l-panel')];
    const cleanups = [];

    // Sticky offset: 0 for panels that fit the viewport, negative for taller ones.
    const setStick = () => {
      for (const panel of panels) panel.style.setProperty('--stick', `${Math.min(0, innerHeight - panel.offsetHeight)}px`);
    };
    setStick();
    const sizes = new ResizeObserver(setStick);
    panels.forEach((p) => sizes.observe(p));
    addEventListener('resize', setStick);
    cleanups.push(() => {
      sizes.disconnect();
      removeEventListener('resize', setStick);
    });

    // Header tone: the last panel (in page order) touching the top strip of the viewport.
    const toned = [...root.querySelectorAll('[data-tone]')];
    const touching = new Set();
    const toneObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.isIntersecting ? touching.add(e.target) : touching.delete(e.target));
        const top = toned.filter((el) => touching.has(el)).pop();
        if (top) setTone(top.dataset.tone);
      },
      { rootMargin: '0px 0px -94% 0px' },
    );
    toned.forEach((el) => toneObserver.observe(el));
    cleanups.push(() => toneObserver.disconnect());

    // One-shot reveals.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          revealObserver.unobserve(e.target);
        }
      },
      { threshold: 0.25 },
    );
    root.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));
    cleanups.push(() => revealObserver.disconnect());

    // The back-to-top button shows after 300px, and hides again over the footer (which has its own link).
    const onScroll = () =>
      setScrolled(scrollY > 300 && scrollY + innerHeight < document.documentElement.scrollHeight - innerHeight * 0.6);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => removeEventListener('scroll', onScroll));

    if (motion) cleanups.push(startTrailing(root));
    return () => cleanups.forEach((fn) => fn());
  }, [rootRef, motion]);

  return { tone, scrolled };
}

// A requestAnimationFrame loop that only runs while something is still moving.
function startTrailing(root) {
  const lagged = [...root.querySelectorAll('[data-lag]')].map((el) => ({
    el,
    anchor: el.closest('.l-panel') ?? el.parentElement,
    smooth: null,
  }));
  const halo = matchMedia('(pointer: fine)').matches ? root.querySelector('.l-halo') : null;
  const pointer = { x: -100, y: -100 };
  const haloPos = { x: -100, y: -100 };
  let frame = 0;
  let last = 0;

  const step = (now) => {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    let moving = false;

    // Heading lag: ease towards where the panel actually is (time constant about 0.2 s).
    const k = 1 - Math.exp(-dt / 200);
    for (const item of lagged) {
      const top = item.anchor.getBoundingClientRect().top;
      item.smooth = item.smooth === null ? top : item.smooth + (top - item.smooth) * k;
      const offset = Math.max(-160, Math.min(160, item.smooth - top));
      item.el.style.translate = `0 ${offset.toFixed(1)}px`;
      if (Math.abs(offset) > 0.2) moving = true;
    }

    if (halo) {
      const h = 1 - Math.exp(-dt / 70);
      haloPos.x += (pointer.x - haloPos.x) * h;
      haloPos.y += (pointer.y - haloPos.y) * h;
      halo.style.translate = `${haloPos.x.toFixed(1)}px ${haloPos.y.toFixed(1)}px`;
      if (Math.abs(pointer.x - haloPos.x) + Math.abs(pointer.y - haloPos.y) > 0.3) moving = true;
    }

    frame = moving ? requestAnimationFrame(step) : 0;
    if (!frame) last = 0;
  };

  const kick = () => {
    if (!frame) frame = requestAnimationFrame(step);
  };
  const onMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    halo?.classList.add('is-on');
    kick();
  };

  addEventListener('scroll', kick, { passive: true });
  if (halo) addEventListener('pointermove', onMove, { passive: true });
  kick();

  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('scroll', kick);
    removeEventListener('pointermove', onMove);
    lagged.forEach(({ el }) => (el.style.translate = ''));
  };
}
