import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../Icon.jsx';
import IconButton from './IconButton.jsx';
import HudBrand from './HudBrand.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import AccountMenu, { APP_LINKS } from './AccountMenu.jsx';
import { NAV_LINKS } from './content.js';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame.js';
import { isNight, useTheme } from '../../hooks/useTheme.js';
import { useAuth } from '../../hooks/useAuth.jsx';

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

const GLASS_AT = 50; // px of scroll before the islands get their glass and borders
const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1));

// The brand's progress (--b, 0 → 1) follows the hero wordmark's fade: the
// wordmark starts to fade at about 22% of the hero's scroll (--p) and is gone
// at 84% (opacity 1.35 - 1.6p, NotoMark / landing.css), so the small "Noto" is
// only complete once the big one has left.
const FADE_START = 0.22;
const FADE_END = 0.84;
function brandProgress() {
  const hero = document.querySelector('.l-hero');
  if (!hero) return 1;
  const r = hero.getBoundingClientRect();
  const p = clamp01(-r.top / (r.height * 0.8));
  return clamp01((p - FADE_START) / (FADE_END - FADE_START));
}

// The account actions: Sign in and Create account, or, signed in, the
// account menu. The Day/Night switch lives with the brand, never here.
function Actions({ signedIn, className = '' }) {
  return (
    <div className={`l-nav-actions ${className}`}>
      {signedIn ? (
        <AccountMenu />
      ) : (
        <>
          <Link className="l-signin l-underglow" to="/login">
            Sign in
          </Link>
          <IconButton to="/register" variant="solid" className="l-nav-cta l-underglow">
            Create account
          </IconButton>
        </>
      )}
    </div>
  );
}

// Desktop: two floating islands from the very top of the page. The centre
// one holds the brand, the section links and (after a rule) the Day/Night
// switch; the right one the account actions. At the top they have no glass or
// borders; after 50px of scrolling those fade in. A glider slides under the
// link you point at and otherwise rests on the section you are reading. The
// small "Noto" draws itself in with the scroll (HudBrand, --b) and is whole
// only once the hero wordmark has faded away.
// Phones and tablets: a bar with the brand, the switch and a menu button.
export default function LandingNav() {
  const desktop = useMediaQuery('(min-width: 992px)');
  const [scrolled, setScrolled] = useState(false);
  const [current, setCurrent] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const last = useRef({ scrolled: false, current: '', b: -1 });
  const headerRef = useRef(null);
  const pillRef = useRef(null);
  const hovered = useRef(null);
  const { theme, setTheme } = useTheme();
  const night = isNight(theme);
  const { isAuthenticated: signedIn, signOut } = useAuth();
  const navigate = useNavigate();

  useScrollFrame(() => {
    const y = scrollY;
    const mid = innerHeight * 0.4;
    let section = '';
    for (const id of SECTION_IDS) {
      const r = document.getElementById(id)?.getBoundingClientRect();
      if (r && r.top <= mid && r.bottom > mid) section = id;
    }
    const b = brandProgress();
    return () => {
      const s = last.current;
      if ((y > GLASS_AT) !== s.scrolled) setScrolled((s.scrolled = y > GLASS_AT));
      if (section !== s.current) setCurrent((s.current = section));
      if (Math.abs(b - s.b) > 0.0005) headerRef.current?.style.setProperty('--b', (s.b = b).toFixed(4));
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

  const close = () => setMenuOpen(false);
  const hover = (link) => () => {
    hovered.current = link;
    placeGlider();
  };

  return (
    <header ref={headerRef} className={`l-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <a className="skip-link" href="#l-main">
        Skip to content
      </a>

      {desktop ? (
        <div className="l-nav-islands">
          <div className="l-glass l-capsule">
            <HudBrand />
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
            <span className="l-capsule-rule" aria-hidden="true" />
            <ThemeToggle night={night} onChange={setTheme} />
          </div>
          <Actions signedIn={signedIn} className="l-glass" />
        </div>
      ) : (
        <div className="l-nav-primary">
          <HudBrand hideIdle className="l-nav-brand" />
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
          {signedIn ? (
            <>
              {APP_LINKS.map((link, i) => (
                <li key={link.to}>
                  <Link className={`l-menu-chip ${i === 0 ? 'is-cta' : ''}`} to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="l-menu-chip"
                  onClick={async () => {
                    close();
                    await signOut();
                    navigate('/', { replace: true });
                  }}
                >
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
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
            </>
          )}
        </ul>
      )}
    </header>
  );
}
