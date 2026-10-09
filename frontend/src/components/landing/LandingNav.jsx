import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Brand from '../Brand.jsx';
import Icon from '../Icon.jsx';
import IconButton from './IconButton.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { NAV_LINKS } from './content.js';
import { useScrollFrame } from '../../hooks/useScrollFrame.js';
import { isNight, useTheme } from '../../hooks/useTheme.js';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const list = matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Two navs in one fixed header. At the top: a wide bar (wordmark left, links
// right). After 50px of scroll on desktop it lifts away and a compact centred
// capsule rises in, with the call to action as a separate pill. Phones keep
// the bar and use a menu button.
export default function LandingNav() {
  const desktop = useMediaQuery('(min-width: 992px)');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const shown = useRef(false);
  const headerRef = useRef(null);
  const { theme, setTheme } = useTheme();
  const night = isNight(theme);

  useScrollFrame(() => {
    const isScrolled = scrollY > 50;
    return () => {
      if (isScrolled === shown.current) return;
      shown.current = isScrolled;
      setScrolled(isScrolled);
    };
  });

  // The phone menu closes on Escape, on a click outside the header, and when a link is used.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    const onClick = (e) => !headerRef.current?.contains(e.target) && setMenuOpen(false);
    addEventListener('keydown', onKey);
    addEventListener('pointerdown', onClick);
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('pointerdown', onClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (desktop) setMenuOpen(false);
  }, [desktop]);

  const morphed = desktop && scrolled;
  const close = () => setMenuOpen(false);

  return (
    <header ref={headerRef} className={`l-nav ${morphed ? 'is-morphed' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip-link" href="#l-main">
        Skip to content
      </a>

      <div className="l-nav-primary" inert={morphed || undefined}>
        <a href="#top" className="brand l-nav-brand" aria-label="Noto, back to top">
          <Brand />
        </a>
        <nav className="l-nav-links" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="l-nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
          <Link className="l-nav-link" to="/login">
            Sign in
          </Link>
          <IconButton to="/register" className="l-nav-cta">
            Create account
          </IconButton>
          <ThemeToggle night={night} onChange={setTheme} />
        </nav>
        <div className="l-nav-tools">
          <ThemeToggle night={night} onChange={setTheme} />
          <button
            type="button"
            className={`l-burger ${menuOpen ? 'is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="l-menu"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="menu" size={20} className="l-burger-open" />
            <Icon name="close" size={20} className="l-burger-close" />
          </button>
        </div>
      </div>

      {desktop && (
        <div className="l-nav-secondary" inert={!morphed || undefined}>
          <div className="l-capsule">
            <a href="#top" className="l-disc" aria-label="Noto, back to top">
              <span className="l-disc-dot" />
            </a>
            <nav className="l-pill" aria-label="Sections">
              {NAV_LINKS.map((link) => (
                <a key={link.href} className="l-nav-link" href={link.href}>
                  {link.label}
                </a>
              ))}
              <Link className="l-nav-link" to="/login">
                Sign in
              </Link>
            </nav>
            <ThemeToggle night={night} onChange={setTheme} />
          </div>
          <IconButton to="/register" variant="solid" className="l-nav-pill-cta">
            Create account
          </IconButton>
        </div>
      )}

      {menuOpen && (
        <ul id="l-menu" className="l-menu">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a className="l-menu-chip" href={link.href} onClick={close}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link className="l-menu-chip" to="/login">
              Sign in
            </Link>
          </li>
          <li>
            <Link className="l-menu-chip is-cta" to="/register">
              Create account
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
