import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'scm.theme';
const THEMES = ['light', 'dark'];

// Day or Night, nothing else. With no saved choice yet, the first visit
// follows the system once (Night unless it asks for light, the same rule as
// global.css) and that becomes the choice.
function readTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (THEMES.includes(saved)) return saved;
  } catch {
    // ignore
  }
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return { theme, setTheme };
}

export const isNight = (theme) => theme === 'dark';

// Switches Day/Night the way the landing page does: where the browser has
// view transitions, the new theme opens as a circle growing from the button
// that was clicked; otherwise, and under reduced motion, it switches at once.
export function switchTheme(next, origin, setTheme) {
  const apply = () => {
    document.documentElement.dataset.theme = next;
    flushSync(() => setTheme(next));
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced || !origin) {
    apply();
    return;
  }

  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(apply);
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      ),
    )
    .catch(() => {});
}
