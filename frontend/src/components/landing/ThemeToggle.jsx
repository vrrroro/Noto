import { flushSync } from 'react-dom';
import Icon from '../Icon.jsx';

// The Day/Night switch. It sets the same theme the app uses (html[data-theme],
// saved as `scm.theme`), so the whole site follows. Where the browser has view
// transitions the new theme opens as a circle from the button; otherwise, and
// under reduced motion, it switches at once. The theme state lives in the nav
// (one useTheme), so every copy of the switch shows the same icon.
export default function ThemeToggle({ night, onChange, className = '' }) {
  function toggle(e) {
    const next = night ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.theme = next;
      flushSync(() => onChange(next));
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) {
      apply();
      return;
    }

    const r = e.currentTarget.getBoundingClientRect();
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

  const label = night ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button type="button" className={`l-theme ${className}`} onClick={toggle} aria-label={label} title={label}>
      <Icon name={night ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
