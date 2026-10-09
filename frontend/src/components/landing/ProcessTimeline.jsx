import { useEffect, useRef, useState } from 'react';
import { UpperTitle } from './IconButton.jsx';
import ProcessDiagram from './ProcessDiagram.jsx';
import { STEPS } from './content.js';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame.js';

// "How it works": a 400vh section whose black slab sticks for three screens
// of scrolling while the four steps open in turn. The open step grows (flex,
// 0.8s); the lilac line and the marker follow the active dot. They are measured
// with a ResizeObserver on the steps, so they track the accordion while it is
// still moving instead of waiting for scrolling to stop.
// Every step is a real button: clicking (or tabbing to) one scrolls to it.
export default function ProcessTimeline({ motion }) {
  const sectionRef = useRef(null);
  const wrapRef = useRef(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const r = section.getBoundingClientRect();
    const progress = clamp01(-r.top / Math.max(1, r.height - innerHeight));
    const index = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
    return () => {
      if (index === activeRef.current) return;
      activeRef.current = index;
      setActive(index);
    };
  }, motion);

  // Line fill height and marker position = the active dot's centre.
  useEffect(() => {
    const wrap = wrapRef.current;
    const measure = () => {
      const dots = wrap.querySelectorAll('.l-step-dot');
      const dot = dots[motion ? active : dots.length - 1];
      if (!dot) return;
      const y = dot.getBoundingClientRect().top - wrap.getBoundingClientRect().top + dot.offsetHeight / 2;
      wrap.style.setProperty('--fill', `${y.toFixed(1)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    wrap.querySelectorAll('.l-step').forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [active, motion]);

  function goTo(i, smooth = true) {
    const section = sectionRef.current;
    if (!motion || !section) return;
    const top = section.getBoundingClientRect().top + scrollY;
    const travel = section.offsetHeight - innerHeight;
    scrollTo({ top: top + ((i + 0.5) / STEPS.length) * travel, behavior: smooth ? 'smooth' : 'instant' });
  }

  return (
    <section id="how" ref={sectionRef} className="l-process" aria-labelledby="l-how-title">
      <div className="l-process-wrap">
        <div className="l-process-slab">
          <UpperTitle>How it works</UpperTitle>
          <h2 id="l-how-title" className="visually-hidden">
            How Noto works
          </h2>
          <div ref={wrapRef} className="l-steps-wrap">
            <span className="l-track" aria-hidden="true">
              <span className="l-track-fill" />
            </span>
            <svg className="l-marker" viewBox="0 0 136 25" aria-hidden="true" focusable="false">
              <rect width="25" height="25" rx="6" />
              <circle cx="12.5" cy="12.5" r="4" />
              <path d="M25 12.5h111" />
            </svg>
            <ol className="l-steps">
              {STEPS.map((step, i) => {
                const open = !motion || i === active;
                return (
                  <li
                    key={step.title}
                    className={`l-step ${open ? 'is-active' : ''} ${!motion || i <= active ? 'is-reached' : ''}`}
                  >
                    <h3 className="l-step-head">
                      <button
                        type="button"
                        className="l-step-btn"
                        aria-expanded={open}
                        aria-controls={`l-step-${i}`}
                        onClick={() => goTo(i)}
                        onFocus={(e) => e.currentTarget.matches(':focus-visible') && goTo(i, false)}
                      >
                        <span className="l-step-index">{String(i + 1).padStart(2, '0')}</span>
                        <span className="l-step-dot" />
                        <span className="l-step-title">{step.title}</span>
                      </button>
                    </h3>
                    <div id={`l-step-${i}`} className="l-step-body">
                      <p>{step.body}</p>
                      <ProcessDiagram kind={step.diagram} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
