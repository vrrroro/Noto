import { Link } from 'react-router-dom';
import MarginNote from './MarginNote.jsx';
import MysteryDot from './MysteryDot.jsx';

// Each letter of the giant wordmark is a window onto a piece of stationery
// (ruled paper, graph paper, a sticky note, a dot grid) that shows on hover.
const LETTERS = ['N', 'O', 'T', 'O'];

export default function Hero() {
  return (
    <section id="top" className="l-panel l-hero" data-tone="page" aria-labelledby="l-hero-title">
      <div className="l-hero-box">
        <h1 id="l-hero-title" className="l-hero-title">
          <span className="l-hero-line l-hero-line-1">Because</span>{' '}
          <span className="l-hero-line l-hero-line-2">“I forgot” isn’t</span>{' '}
          <span className="l-hero-line l-hero-line-3">a study plan.</span>
        </h1>
      </div>

      <div className="l-hero-intro">
        <p>Noto keeps your assignments, deadlines and notes in one place. Free, private, and it works in any browser.</p>
        <div className="l-hero-actions">
          <Link to="/register" className="btn btn-primary">
            Create your account
          </Link>
          <Link to="/login" className="keycap">
            I have an account
          </Link>
        </div>
      </div>

      <MarginNote
        className="l-note-hero-left"
        text="assignments,"
        arrow={{ '--arrow-rot': '8deg' }}
      />
      <MarginNote
        className="l-note-hero-right"
        text="& every last note."
        arrow={{ '--arrow-rot': '-8deg', '--arrow-sx': -1 }}
      />
      <MysteryDot />

      <div className="l-wordmark" aria-hidden="true">
        {LETTERS.map((letter, i) => (
          <span key={i} className={`l-letter l-letter-${i + 1}`} style={{ '--i': i }}>
            {letter}
          </span>
        ))}
      </div>
    </section>
  );
}
