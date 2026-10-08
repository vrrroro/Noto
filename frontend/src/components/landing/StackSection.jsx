import { useRef } from 'react';
import Icon from '../Icon.jsx';
import IconButton from './IconButton.jsx';
import { STACK } from './content.js';
import { damp, requestScrollFrame, useScrollFrame } from '../../hooks/useScrollFrame.js';

// "Built on AWS": four frosted cards over a pair of mirrored Noto shapes that
// turn as the pointer moves across the section (horizontal position only,
// eased, resting in the middle). Through the glass they read as soft colour.
export default function StackSection({ motion }) {
  const sectionRef = useRef(null);
  const pointer = useRef({ target: 0.5, current: 0.5 });

  useScrollFrame((dt) => {
    const p = pointer.current;
    return () => {
      p.current = damp(p.current, p.target, 220, dt);
      const section = sectionRef.current;
      section?.style.setProperty('--m', p.current.toFixed(4));
      section?.style.setProperty('--d', Math.abs(p.current - 0.5).toFixed(4));
      return Math.abs(p.current - p.target) > 0.0005;
    };
  }, motion);

  function onPointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const r = sectionRef.current.getBoundingClientRect();
    pointer.current.target = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    requestScrollFrame();
  }

  return (
    <section
      id="aws"
      ref={sectionRef}
      className="l-section l-aws"
      aria-labelledby="l-aws-title"
      onPointerMove={motion ? onPointerMove : undefined}
    >
      <div className="l-container">
        <h2 id="l-aws-title" className="l-h3 l-aws-title">
          Built on AWS
        </h2>
        <p className="l-text-large l-aws-sub">Seven managed services, and not one server of our own to look after.</p>
        <div className="l-aws-stage">
          <div className="l-lens" aria-hidden="true">
            <span className="is-a" />
            <span className="is-b" />
          </div>
          <ul className="l-aws-cards">
            {STACK.map((card) => (
              <li key={card.title} className="l-aws-card">
                <Icon name={card.icon} size={48} />
                <div className="l-aws-card-text">
                  <p className="l-aws-service">{card.service}</p>
                  <h3 className="l-h6">{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="l-aws-cta">
          <IconButton href="#app">See it in the app</IconButton>
        </div>
      </div>
    </section>
  );
}
