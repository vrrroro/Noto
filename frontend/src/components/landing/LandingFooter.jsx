import { Link } from 'react-router-dom';
import MarginNote from './MarginNote.jsx';

export default function LandingFooter() {
  return (
    <footer className="l-panel l-deal l-footer" data-tone="dark" style={{ '--deal-tilt': '0.7deg' }}>
      <div className="l-footer-cta">
        <div className="l-heading" data-lag>
          <p className="l-eyebrow">Ready when you are</p>
          <h2 className="l-footer-title">
            <span>Got a deadline?</span> <span className="quiet">Good. Now it has a home.</span>
          </h2>
        </div>
        <div className="l-footer-actions">
          <Link to="/register" className="btn btn-primary l-footer-primary">
            Create your free account
          </Link>
          <Link to="/login" className="keycap">
            Sign in
          </Link>
          <MarginNote className="l-note-go" text="go on… it takes a minute" arrow={{}} />
        </div>
      </div>

      <div className="l-footer-bar">
        <p className="l-footer-meta">
          © 2026 Noto
          <br />A student cloud project on AWS
        </p>
        <p className="l-footer-word" aria-hidden="true">
          Noto
        </p>
        <nav className="l-footer-links" aria-label="Footer">
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
          <a href="#top">Back to top</a>
        </nav>
      </div>
    </footer>
  );
}
