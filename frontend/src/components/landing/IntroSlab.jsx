import { useRef } from 'react';
import { INTRO_STATEMENT } from './content.js';
import { clamp01, damp, useScrollFrame } from '../../hooks/useScrollFrame.js';

const WORDS = INTRO_STATEMENT.split(' ');
// Each word starts resolving at its share of the first 75% of the range and
// takes the remaining 25% to reach full ink (a 1.5 "stagger amount" in GSAP terms).
const wordStart = (i) => ((i / (WORDS.length - 1)) * 0.75).toFixed(4);

function Words() {
  return WORDS.map((word, i) => (
    <span key={i} className="l-word" style={{ '--s': wordStart(i) }}>
      {word}{' '}
    </span>
  ));
}

// The same statement, for the copies the orbs carry (see .l-orb-copy).
function Copy() {
  return (
    <div className="l-orb-copy">
      <p className="l-intro-text">
        <Words />
      </p>
    </div>
  );
}

// No slab of its own: the section floats on the page's purple flow. Inside, a
// stage pins for one screen: two orbs travel in from the edges, merge at the
// centre and part again while the statement resolves from 30% to full ink one
// word at a time. Each orb, and the lens where they overlap, carries its own
// copy of the statement in the opposite ink, so the words show in negative
// wherever an orb passes (colours and geometry in landing.css, .l-orbs).
// Everything is scrubbed by scroll position (eased), so scrolling up reverses it.
export default function IntroSlab({ motion }) {
  const sectionRef = useRef(null);
  const eased = useRef(null);

  useScrollFrame((dt) => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const r = section.getBoundingClientRect();
    const travel = Math.max(1, r.height - innerHeight);
    const pinned = -r.top / travel; // 0 when the stage pins, 1 when it lets go
    const target = motion
      ? {
          t: clamp01((pinned - 0.2) / 0.7),
          // The orbs merge (q = 0.5) at about a third of the pin, once the words are on screen.
          q: clamp01((pinned + 0.1) / 0.9),
        }
      : { t: 1, q: 1 };

    return () => {
      const cur = eased.current ?? { ...target };
      let moving = false;
      for (const key of Object.keys(target)) {
        cur[key] = motion ? damp(cur[key], target[key], 160, dt) : target[key];
        if (Math.abs(cur[key] - target[key]) > 0.0005) moving = true;
      }
      eased.current = cur;
      section.style.setProperty('--t', cur.t.toFixed(4));
      section.style.setProperty('--q', cur.q.toFixed(4));
      section.style.setProperty('--k', Math.sin(cur.q * Math.PI).toFixed(4));
      return moving;
    };
  });

  return (
    <section ref={sectionRef} className="l-intro" aria-label="Why Noto">
      <div className="l-intro-stage">
        <p className="l-intro-text">
          <span className="visually-hidden">{INTRO_STATEMENT}</span>
          <span aria-hidden="true">
            <Words />
          </span>
        </p>
        <div className="l-orbs" aria-hidden="true">
          <div className="l-orb is-a">
            <span className="l-orb-skin" />
            <Copy />
          </div>
          <div className="l-orb is-b">
            <span className="l-orb-skin" />
            <Copy />
            <div className="l-orb-lens">
              <Copy />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
