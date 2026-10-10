import { Link } from 'react-router-dom';
import Brand from '../Brand.jsx';
import { NAV_LINKS } from './content.js';

// Dark plum footer with a violet glow. Links use the two-phase underline: it draws in from the left
// on hover and leaves to the right.
export default function LandingFooter() {
  return (
    <footer className="l-footer" aria-labelledby="l-footer-title">
      <div className="l-container l-grid l-footer-grid">
        <h2 id="l-footer-title" className="l-h4 l-footer-statement">
          Built for deadlines,
          <br />
          notes and the night before.
        </h2>
        <div className="l-footer-brand">
          <Brand />
          <p>
            Assignments, deadlines and notes
            <br />
            In the cloud, on AWS
          </p>
        </div>

        <nav className="l-footer-col" aria-label="Sections">
          <p className="l-footer-label">Product</p>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a className="l-uline" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a className="l-uline" href="#app">
                Inside the app
              </a>
            </li>
          </ul>
        </nav>
        <nav className="l-footer-col" aria-label="Account">
          <p className="l-footer-label">Account</p>
          <ul>
            <li>
              <Link className="l-uline" to="/register">
                Create account
              </Link>
            </li>
            <li>
              <Link className="l-uline" to="/login">
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
        <div className="l-footer-col is-wide">
          <p className="l-footer-label">Built on</p>
          <p>Cognito, API Gateway, Lambda, DynamoDB, S3, CloudWatch and Amplify.</p>
        </div>

        <div className="l-footer-credits">
          <p>© {new Date().getFullYear()} Noto. All rights reserved.</p>
          <p>This was bloomed by Rohit</p>
          <a className="l-uline" href="#top">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
