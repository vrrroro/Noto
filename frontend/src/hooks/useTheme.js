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
  return { theme, cycleTheme };
}
