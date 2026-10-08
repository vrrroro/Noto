import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { UpperTitle } from './IconButton.jsx';
import { FEATURES } from './content.js';
import { clamp01, useScrollFrame } from '../../hooks/useScrollFrame.js';

const CARD_GAP = 20; // px; matches .l-card margin-bottom (1.25rem)

// Feature cards that stack as you scroll. Each card is position: sticky, 20px
// lower than the one before, so the next card lands on top of it; cards that
// have arrived shrink a little (0.90, 0.92 …) so their edges fan out above the
// newest one. The volt card caps the deck, then the whole deck scrolls away
// together when the list ends. The shrink is computed from where each card
// would be without sticky positioning, so it never depends on sticky offsets.
export default function FeatureStack({ motion }) {
  const listRef = useRef(null);
  const [shown, setShown] = useState(!motion);

  // Cards fade in one after another when the section reaches the middle of the screen.
  useEffect(() => {
    if (!motion) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -50% 0px' },
    );
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [motion]);

  useScrollFrame(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const cards = [...list.children];
    const vh = innerHeight;
    let natural = list.getBoundingClientRect().top;
    const scales = cards.map((card, i) => {
      const top = natural;
      natural += card.offsetHeight + CARD_GAP;
      const target = i === cards.length - 1 ? 1 : 0.9 + i * 0.02;
      // Starts when the card's top is 30i px below the 20% line, done when it would reach 10%.
      const start = vh * 0.2 + 30 * i;
      const progress = clamp01((start - top) / (vh * 0.1 + 30 * i));
      return 1 - (1 - target) * progress;
    });
    return () => cards.forEach((card, i) => card.style.setProperty('--scale', scales[i].toFixed(4)));
  }, motion);

  return (
    <section id="features" className="l-section l-features" aria-labelledby="l-features-title">
      <div className="l-container l-grid">
        <UpperTitle>What’s inside</UpperTitle>
        <h2 id="l-features-title" className="visually-hidden">
          What’s inside Noto
        </h2>
        <ul ref={listRef} className={`l-cards ${shown ? 'is-in' : ''}`}>
          {FEATURES.map((f, i) => (
            <li key={f.title} className={`l-card ${f.body ? '' : 'is-volt'}`} style={{ '--i': i }}>
              <Icon name={f.icon} size={40} className="l-card-icon" />
              <div className="l-card-text">
                <h3 className="l-h6">{f.title}</h3>
                {f.body && <p>{f.body}</p>}
              </div>
            </li>
          ))}
        </ul>
        <div className="l-closing l-reveal" data-reveal>
          <p>
            Noto doesn’t try to be everything. It keeps the four things a semester runs on, and makes them easy to
            find.
          </p>
          <a className="l-circle-link" href="#how" aria-label="Next: how it works">
            <Icon name="arrowDown" size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
