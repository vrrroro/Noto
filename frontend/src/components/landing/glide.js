// In-page navigation for the landing page. A plain smooth scroll to a far
// section has to travel through everything in between, and the 400vh pinned
// "How it works" section then fills the screen for a long stretch, so a jump
// to "Under the hood" looked as if it stopped there. (Gliding only the last
// stretch does not help either: the screen before a section can still be
// inside a pinned one.) So for a far jump the page fades out for a moment,
// jumps straight to the target out of sight, and the target section rises
// and fades back in. Near targets just glide. Under reduced motion it jumps.
const FADE_MS = 160;

export function glideTo(target, { motion = true } = {}) {
  const y = target.id === 'top' ? 0 : target.getBoundingClientRect().top + scrollY;
  if (!motion) {
    scrollTo({ top: y, behavior: 'instant' });
    return Promise.resolve();
  }

  const distance = y - scrollY;
  const near = Math.abs(distance) <= innerHeight * 1.2;
  if (near) {
    scrollTo({ top: y, behavior: 'smooth' });
    return Promise.resolve();
  }

  const main = document.getElementById('l-main');
  const fadeOut = main?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-in', fill: 'forwards' });
  return (fadeOut?.finished ?? Promise.resolve()).then(() => {
    scrollTo({ top: y, behavior: 'instant' });
    fadeOut?.cancel();
    // The page fades back in; only the target section rises, so nothing of
    // the section before it slides into view.
    main?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    target.animate(
      [{ transform: `translateY(${Math.sign(distance) * 28}px)` }, { transform: 'none' }],
      { duration: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  });
}

// One delegated listener for every "#section" link on the page (nav, footer,
// buttons). The skip link keeps the browser's own behaviour (it moves focus).
export function installGlide(root, { motion }) {
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip-link')) return;
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    glideTo(target, { motion });
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
