import Icon from '../Icon.jsx';
import { switchTheme } from '../../hooks/useTheme.js';

// The Day/Night switch. It sets the same theme the app uses (html[data-theme],
// saved as `scm.theme`), so the whole site follows, and the new theme opens as
// a circle from the button (switchTheme). The theme state lives in the nav
// (one useTheme), so every copy of the switch shows the same icon.
export default function ThemeToggle({ night, onChange, className = '' }) {
  const label = night ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button"
      className={`l-theme ${className}`}
      onClick={(e) => switchTheme(night ? 'light' : 'dark', e.currentTarget, onChange)}
      aria-label={label}
      title={label}
    >
      <Icon name={night ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
