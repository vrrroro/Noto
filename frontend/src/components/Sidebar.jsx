import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { isDemoMode } from '../config.js';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/assignments', label: 'Assignments', icon: 'assignments' },
  { to: '/notes', label: 'Notes', icon: 'notes' },
  { to: '/subjects', label: 'Subjects', icon: 'subjects' },
];

const THEME_META = {
  system: { icon: 'monitor', label: 'System theme' },
  light: { icon: 'sun', label: 'Light theme' },
  dark: { icon: 'moon', label: 'Dark theme' },
};

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <div className="sidebar-top">
        <NavLink to="/" className="brand" aria-label="Student Cloud Manager home">
          <span className="brand-mark">
            <Icon name="cloud" size={20} />
          </span>
          <span className="brand-text">
            Student Cloud
            <small>Manager</small>
          </span>
        </NavLink>
        <button
          type="button"
          className="btn btn-ghost btn-icon menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="sidebar-panel"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>

      <div className="sidebar-panel" id="sidebar-panel">
        <nav aria-label="Main">
          <ul className="nav-list">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="nav-link">
                  <Icon name={link.icon} />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {isDemoMode && (
            <p className="demo-badge" title="AWS is not configured, so data is stored only in this browser.">
              <strong>Demo mode</strong>
              Data stays in this browser
            </p>
          )}
          <button type="button" className="nav-link nav-button" onClick={cycleTheme}>
            <Icon name={THEME_META[theme].icon} />
            {THEME_META[theme].label}
          </button>
          <div className="user-box">
            <span className="avatar" aria-hidden="true">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="user-email" title={user?.email}>
              {user?.email}
            </span>
          </div>
          <button type="button" className="nav-link nav-button" onClick={handleSignOut}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
