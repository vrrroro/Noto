import { useEffect, useRef } from 'react';
import { clamp01, damp, requestScrollFrame, useScrollFrame } from '../../hooks/useScrollFrame.js';

// The Noto wordmark as the hero's centrepiece. On arrival the four letters
// rise out of the floor one after another and the orange dot drops in from
// above the screen, squashes, bounces twice and settles, once (CSS keyframes
// in landing.css). After that:
// - scrolling the hero away spreads the letters apart and swells the dot (--p);
// - the pointer leans the word and nudges the dot towards it (--px), and the
//   lilac haze behind the hero follows it (--mx on the hero).
// Both values run through the shared scroll loop, so nothing ticks while idle.
const LETTERS = ['N', 'o', 't', 'o'];
const DRIFT = [1, -1, 1, -1]; // each letter tips the opposite way to its neighbour

export default function NotoMark({ motion }) {
  const markRef = useRef(null);
  const pointer = useRef({ target: 0, current: 0, haze: 0.5, hazeTarget: 0.5 });
  const eased = useRef(null);

  useScrollFrame((dt) => {
    const mark = markRef.current;
    const hero = mark?.closest('.l-hero');
    if (!hero) return undefined;
    const r = hero.getBoundingClientRect();
    const target = clamp01(-r.top / (r.height * 0.8));

    return () => {
      const p = pointer.current;
      const cur = eased.current ?? target;
      const next = damp(cur, target, 140, dt);
      eased.current = next;
      p.current = damp(p.current, p.target, 260, dt);
      p.haze = damp(p.haze, p.hazeTarget, 420, dt);
      mark.style.setProperty('--p', next.toFixed(4));
      mark.style.setProperty('--px', p.current.toFixed(4));
      hero.style.setProperty('--mx', p.haze.toFixed(4));
      return (
        Math.abs(next - target) > 0.0005 ||
        Math.abs(p.current - p.target) > 0.0005 ||
        Math.abs(p.haze - p.hazeTarget) > 0.0005
      );
    };
  }, motion);

  // Listens on the whole hero, so the word reacts wherever the pointer is.
  useEffect(() => {
    const hero = markRef.current?.closest('.l-hero');
    if (!motion || !hero) return undefined;
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      const x = clamp01((e.clientX - r.left) / r.width);
      pointer.current.target = x * 2 - 1;
      pointer.current.hazeTarget = x;
      requestScrollFrame();
    };
    const onLeave = () => {
      pointer.current.target = 0;
      requestScrollFrame();
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, [motion]);

  return (
    <div ref={markRef} className="l-mark" aria-hidden="true">
      <span className="l-mark-word">
        {LETTERS.map((letter, i) => (
          <span key={i} className="l-mark-mask">
            <span className="l-mark-glyph" style={{ '--i': i, '--dy': DRIFT[i] }}>
              {letter}
            </span>
          </span>
        ))}
        <span className="l-mark-dot" />
      </span>
    </div>
  );
}
