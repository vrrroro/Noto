import { useState } from 'react';
import { Arrow } from './MarginNote.jsx';
import { FEATURES } from './content.js';

function Asterisk() {
  return (
    <svg className="l-asterisk" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path d="M20 3v34M3 20h34M8 8l24 24M32 8L8 32" />
    </svg>
  );
}

// One copy of the feature list. The marquee shows two back to back so the crawl
// loops seamlessly; the second copy is hidden from assistive technology and focus.
function FeatureList({ copy = false }) {
  return (
    <ul className="l-feature-list" aria-hidden={copy || undefined} inert={copy || undefined}>
      {FEATURES.map((f, i) => {
        const id = copy ? undefined : `l-feature-${i}`;
        return (
          <li key={f.title} className="l-feature">
            <button type="button" className="l-feature-title" aria-describedby={id}>
              <Asterisk />
              <span>{f.title}</span>
            </button>
            <div className="l-feature-card">
              <Arrow className="l-feature-arrow" />
              <div className="l-glass" id={id}>
                <p className="l-card-heading">{f.title}</p>
                <p>{f.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function FeaturesSection() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      className="l-panel l-deal l-features"
      data-tone="light"
      style={{ '--deal-tilt': '0.7deg' }}
      aria-labelledby="l-features-title"
    >
      <div className="l-features-copy">
        <div className="l-heading" data-lag>
          <p className="l-eyebrow">What’s inside</p>
          <h2 id="l-features-title" className="l-mega">
            Everything a semester needs.
          </h2>
        </div>
        <p className="l-body l-rise" data-reveal>
          Noto is built for one person: a student with five subjects, too many PDFs and a deadline they half remember.
          It does a few things and does them properly, so your evening goes on the assignment, not on finding it.
        </p>
        <div className="l-rise" data-reveal>
          <p className="l-sub">But that’s just the start…</p>
          <p className="l-body">
            Your account works in any browser, on a laptop in the library or your phone on the bus. Everything is
            private to you: other accounts can’t see your assignments, and your files sit in a private store that
            only opens with a short-lived link.
          </p>
        </div>
      </div>

      <div className={`l-marquee ${paused ? 'is-paused' : ''}`}>
        <div className="l-marquee-track">
          <FeatureList />
          <FeatureList copy />
        </div>
      </div>
      <button type="button" className="keycap l-marquee-toggle" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
        <span className="l-toggle-led" aria-hidden="true" />
        Pause the list
      </button>
    </section>
  );
}
