import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AccountButton from './AccountButton.jsx';
import Icon from './Icon.jsx';
import Brand from './Brand.jsx';
import { switchTheme, useTheme } from '../hooks/useTheme.js';
import { isDemoMode } from '../config.js';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/assignments', label: 'Assignments' },
  { to: '/notes', label: 'Notes' },
  { to: '/subjects', label: 'Subjects' },
];

const THEME_LABEL = { light: 'Day', dark: 'Night' };

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // One dot travels to the active link on a spring. The first placement is
  // instant so the dot does not fly in from the top on page load.
  const listRef = useRef(null);
  const [dot, setDot] = useState({ y: 0, visible: false, instant: true });

  useLayoutEffect(() => {
    function place() {
      const active = listRef.current?.querySelector('.nav-link.active');
      setDot((d) => ({
        y: active ? active.offsetTop + active.offsetHeight / 2 : d.y,
        visible: Boolean(active),
        instant: !d.visible,
      }));
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [location.pathname, menuOpen]);

  return (
    <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
      <div className="sidebar-top">
        <NavLink to="/" className="brand" aria-label="Noto home">
          <Brand />
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
          <ul className="nav-list" ref={listRef}>
            <li
              className={`nav-dot ${dot.instant ? 'is-instant' : ''}`}
              style={{ transform: `translateY(${dot.y}px)`, opacity: dot.visible ? 1 : 0 }}
              role="presentation"
              aria-hidden="true"
            />
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className="nav-link">
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
          <button
            type="button"
            className="nav-link nav-button"
            onClick={(e) => switchTheme(theme === 'dark' ? 'light' : 'dark', e.currentTarget, setTheme)}
            aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${theme === 'dark' ? 'Day' : 'Night'}`}
          >
            <span className="nav-button-key">Theme</span>
            {THEME_LABEL[theme]}
          </button>
          <AccountButton />
        </div>
      </div>
    </aside>
  );
}
