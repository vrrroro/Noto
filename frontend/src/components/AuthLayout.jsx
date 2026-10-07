import Brand from './Brand.jsx';
import { isDemoMode } from '../config.js';

// The arch window: a single vine climbs from the base and ends in Noto's dot.
function ArchIllustration() {
  return (
    <div className="auth-arch">
      <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" focusable="false">
        <path
          className="vine"
          d="M150 410 C 120 350, 190 320, 160 270 S 100 200, 140 150 S 200 90, 158 52"
        />
        <path className="leaf" d="M160 270 C 190 262, 206 240, 204 222 C 186 226, 166 244, 160 270 Z" />
        <path className="leaf" d="M140 150 C 110 146, 92 128, 92 108 C 112 112, 134 128, 140 150 Z" />
        <path className="leaf" d="M152 330 C 124 330, 106 314, 102 296 C 124 296, 144 310, 152 330 Z" />
        <circle className="bud" cx="158" cy="52" r="9" fill="var(--orange)" />
      </svg>
    </div>
  );
}

export default function AuthLayout({ label, title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <section className="auth-intro" aria-hidden="true">
        <div className="brand auth-intro-brand">
          <Brand />
        </div>
        <ArchIllustration />
        <h2>
          Assignments, deadlines and notes, kept in <em>one</em> place.
        </h2>
        <ul className="auth-points">
          <li>See what is due next</li>
          <li>Keep notes together by subject</li>
          <li>Open them from any browser</li>
        </ul>
      </section>

      <main className="auth-main">
        <div className="auth-brand brand brand-large">
          <Brand />
        </div>
        <div className="auth-card invert">
          {label && <p className="label">{label}</p>}
          <h1>{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
          {isDemoMode && (
            <p className="alert alert-info">
              <strong>Demo mode.</strong> AWS is not configured, so accounts and data are stored only in this browser.
            </p>
          )}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
