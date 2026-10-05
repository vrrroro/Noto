import Icon from './Icon.jsx';
import { isDemoMode } from '../config.js';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <section className="auth-intro" aria-hidden="true">
        <div className="brand brand-large">
          <span className="brand-mark">
            <Icon name="cloud" size={22} />
          </span>
          <span className="brand-text">
            Student Cloud
            <small>Manager</small>
          </span>
        </div>
        <h2>Assignments, deadlines and notes in one place.</h2>
        <ul className="auth-points">
          <li>
            <Icon name="calendar" /> See what is due next
          </li>
          <li>
            <Icon name="notes" /> Upload and download notes by subject
          </li>
          <li>
            <Icon name="cloud" /> Runs on AWS serverless services
          </li>
        </ul>
      </section>

      <main className="auth-main">
        <div className="auth-card">
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
