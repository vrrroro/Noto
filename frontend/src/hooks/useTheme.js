import { useEffect, useState } from 'react';

const KEY = 'scm.theme';
const ORDER = ['system', 'light', 'dark'];

function readTheme() {
  try {
    return ORDER.includes(localStorage.getItem(KEY)) ? localStorage.getItem(KEY) : 'system';
  } catch {
    return 'system';
  }
}

// "system" follows the operating system; light/dark override it.
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const cycleTheme = () => setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);
  return { theme, setTheme, cycleTheme };
}

// True when the page is showing Night: chosen, or "system" on a system that
// does not ask for light (the same rule as global.css).
export function isNight(theme) {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return typeof matchMedia === 'undefined' || !matchMedia('(prefers-color-scheme: light)').matches;
}
