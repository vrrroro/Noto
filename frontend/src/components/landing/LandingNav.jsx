import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import IconButton from './IconButton.jsx';
import HudBrand from './HudBrand.jsx';
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

const HUD_AT = 50; // px of scroll before the desktop bar turns into the HUD
const BRAND_AT = 160; // px of scroll before the small wordmark draws itself in
const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1));

// Sign in, the Day/Night switch and Create account: the same group in the
// top bar and in the HUD.
function Actions({ night, onTheme, className = '' }) {
  return (
    <div className={`l-nav-actions ${className}`}>
      <Link className="l-signin l-underglow" to="/login">
        Sign in
      </Link>
      <ThemeToggle night={night} onChange={onTheme} />
      <IconButton to="/register" variant="solid" className="l-nav-cta l-underglow">
        Create account
      </IconButton>
    </div>
  );
}

// Two navs in one fixed header. At the top of the page: a wide bar (the
// section links, then the actions; nothing in the left corner).
// After 50px on desktop it lifts away and the HUD rises in: a glass pill in
// the centre with the brand and the section links, and the actions in a
// glass pill on the right. A glider slides under the link you point at and
// otherwise rests on the section you are reading. After 160px the brand
// draws itself in (HudBrand). Phones keep the bar, with the switch and a menu.
export default function LandingNav() {
  const desktop = useMediaQuery('(min-width: 992px)');
  const [scrolled, setScrolled] = useState(false);
  const [branded, setBranded] = useState(false);
  const [current, setCurrent] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const last = useRef({ scrolled: false, branded: false, current: '' });
  const headerRef = useRef(null);
  const pillRef = useRef(null);
  const hovered = useRef(null);
  const { theme, setTheme } = useTheme();
  const night = isNight(theme);

  useScrollFrame(() => {
    const y = scrollY;
    const mid = innerHeight * 0.4;
    let section = '';
    for (const id of SECTION_IDS) {
      const r = document.getElementById(id)?.getBoundingClientRect();
      if (r && r.top <= mid && r.bottom > mid) section = id;
    }
    return () => {
      const s = last.current;
      if ((y > HUD_AT) !== s.scrolled) setScrolled((s.scrolled = y > HUD_AT));
      if ((y > BRAND_AT) !== s.branded) setBranded((s.branded = y > BRAND_AT));
      if (section !== s.current) setCurrent((s.current = section));
    };
  });

  // The glider: under the hovered link, else under the current section's link, else hidden.
  const placeGlider = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const link = hovered.current ?? pill.querySelector('.l-nav-link.is-current');
    pill.classList.toggle('has-glider', Boolean(link));
    if (!link) return;
    pill.style.setProperty('--gx', `${link.offsetLeft}px`);
    pill.style.setProperty('--gw', `${link.offsetWidth}px`);
  }, []);

  useLayoutEffect(placeGlider, [current, desktop, placeGlider]);

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
  const hover = (link) => () => {
    hovered.current = link;
    placeGlider();
  };

  return (
    <header ref={headerRef} className={`l-nav ${morphed ? 'is-morphed' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip-link" href="#l-main">
        Skip to content
      </a>

      <div className="l-nav-primary" inert={morphed || undefined}>
        <HudBrand shown={!desktop && branded} hideIdle className="l-nav-brand" />
        <nav className="l-nav-links" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="l-nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <Actions night={night} onTheme={setTheme} />
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
          <div className="l-glass l-capsule">
            <HudBrand shown={morphed && branded} />
            <span className="l-capsule-rule" aria-hidden="true" />
            <nav ref={pillRef} className="l-pill" aria-label="Sections" onPointerLeave={hover(null)}>
              <span className="l-pill-glider" aria-hidden="true" />
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  className={`l-nav-link ${current === link.href.slice(1) ? 'is-current' : ''}`}
                  href={link.href}
                  aria-current={current === link.href.slice(1) ? 'location' : undefined}
                  onPointerEnter={(e) => hover(e.currentTarget)()}
                  onFocus={(e) => hover(e.currentTarget)()}
                  onBlur={hover(null)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <Actions night={night} onTheme={setTheme} className="l-glass" />
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
            <Link className="l-menu-chip is-cta l-underglow" to="/register">
              Create account
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
