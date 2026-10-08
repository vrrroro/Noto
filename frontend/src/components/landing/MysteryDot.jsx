import { useRef, useState } from 'react';
import { DOT_STEPS } from './content.js';

// A school bell, synthesised (no audio file): three strikes of a few inharmonic partials.
function ringBell() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  const start = ctx.currentTime + 0.02;
  for (let strike = 0; strike < 3; strike++) {
    const t = start + strike * 0.42;
    for (const [ratio, level] of [[1, 1], [2.76, 0.45], [5.4, 0.2], [8.93, 0.08]]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880 * ratio;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(level, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 1.6);
    }
  }
  setTimeout(() => ctx.close(), 3200);
  return ctx;
}

// The easter egg: a tiny orange dot that gets more annoyed each time it is
// clicked, and finally rings the school bell (only ever on a click).
export default function MysteryDot() {
  const [step, setStep] = useState(-1);
  const bell = useRef(null);
  const current = DOT_STEPS[step];

  function handleClick() {
    if (step < DOT_STEPS.length - 1) {
      setStep(step + 1);
      if (step + 1 < DOT_STEPS.length - 1) return;
    }
    if (bell.current && bell.current.state !== 'closed') {
      bell.current.close();
      bell.current = null;
    } else {
      bell.current = ringBell();
    }
  }

  return (
    <div className="l-dot-wrap">
      <button
        type="button"
        className={`l-dot ${step >= 0 ? 'is-awake' : ''}`}
        style={{ cursor: current?.cursor ?? 'help' }}
        onClick={handleClick}
        aria-label="A suspicious orange dot"
      >
        <span className="l-dot-core" />
      </button>
      {current && (
        <svg key={step} className="l-badge" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <defs>
            <path id="l-badge-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
          </defs>
          <text>
            <textPath href="#l-badge-ring" textLength="236" lengthAdjust="spacing">
              {`${current.text} • ${current.text} • `}
            </textPath>
          </text>
        </svg>
      )}
      <span className="visually-hidden" aria-live="polite">
        {current?.text ?? ''}
      </span>
    </div>
  );
}
