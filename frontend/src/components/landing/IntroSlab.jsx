import { useRef } from 'react';
import { INTRO_STATEMENT } from './content.js';
import { clamp01, damp, useScrollFrame } from '../../hooks/useScrollFrame.js';

const WORDS = INTRO_STATEMENT.split(' ');
// Each word starts resolving at its share of the first 75% of the range and
// takes the remaining 25% to reach full ink (a 1.5 "stagger amount" in GSAP terms).
const wordStart = (i) => ((i / (WORDS.length - 1)) * 0.75).toFixed(4);

// A black slab that starts wider than the page (105%) and pulls in to 95% as
// it leaves, showing its rounded corners. Inside, a stage pins for one screen:
// two Noto dots travel in from the edges, overlap at the centre and part again,
// then the statement resolves from 30% to full white one word at a time.
// Everything is scrubbed by scroll position (eased), so scrolling up reverses it.
export default function IntroSlab({ motion }) {
  const sectionRef = useRef(null);
  const eased = useRef(null);

  useScrollFrame((dt) => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const r = section.getBoundingClientRect();
    const vh = innerHeight;
    const travel = Math.max(1, r.height - vh);
    const pinned = -r.top / travel; // 0 when the stage pins, 1 when it lets go
    const target = motion
      ? {
          t: clamp01((pinned - 0.2) / 0.7),
          q: clamp01((pinned + 0.15) / 0.65),
          w: 105 - 10 * clamp01((vh - r.bottom) / (vh * 0.5)),
        }
      : { t: 1, q: 1, w: 95 };

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
      section.style.setProperty('--w', `${cur.w.toFixed(3)}%`);
      return moving;
    };
  });

  return (
    <section ref={sectionRef} className="l-intro l-dark" data-nav="dark" aria-label="Why Noto">
      <div className="l-intro-bg" aria-hidden="true" />
      <div className="l-intro-stage">
        <div className="l-orbs" aria-hidden="true">
          <span className="l-orb is-a" />
          <span className="l-orb is-b" />
        </div>
        <p className="l-intro-text">
          <span className="visually-hidden">{INTRO_STATEMENT}</span>
          <span aria-hidden="true">
            {WORDS.map((word, i) => (
              <span key={i} className="l-word" style={{ '--s': wordStart(i) }}>
                {word}{' '}
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
