import { Link } from 'react-router-dom';
import Brand from '../Brand.jsx';
import { useTyper } from '../../hooks/useTyper.js';
import { HEADER_WORDS } from './content.js';

// Fixed header. Its colour follows the panel underneath (`tone`), and the
// brand dot hops each time the tone changes.
export default function LandingHeader({ tone, motion }) {
  const word = useTyper(HEADER_WORDS, { typeMs: 80, eraseMs: 40, holdMs: 3000, startMs: 1800, enabled: motion });

  return (
    <header className="l-header" data-tone={tone}>
      <a className="skip-link" href="#l-main">
        Skip to content
      </a>
      <a href="#top" className="brand l-brand" aria-label="Noto, back to top">
        <span key={tone} className="l-brand-inner">
          <Brand />
        </span>
      </a>
      <nav className="l-header-nav" aria-label="Account">
        <Link to="/login" className="keycap">
          Sign in
        </Link>
        <Link to="/register" className="btn btn-primary l-lets" aria-label="Let’s start: create an account">
          <span className="l-lets-typed" aria-hidden="true">
            Let’s {word}
            <span className="l-caret" />
          </span>
          <span className="l-lets-short" aria-hidden="true">
            Start free
          </span>
        </Link>
      </nav>
    </header>
  );
}
