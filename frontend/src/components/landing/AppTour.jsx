import { useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { withNoto } from '../NotoWord.jsx';
import { UpperTitle } from './IconButton.jsx';
import { SCREENS } from './content.js';

// A screenshot in both themes. Both are in the page and CSS shows the one that
// matches the current theme (.l-shot-day / .l-shot-night), so the Day/Night
// switch swaps them at once, inside its circular reveal too.
function ThemeImage({ image, alt }) {
  return (
    <>
      <img className="l-shot-day" src={image.day} alt={alt} loading="lazy" />
      <img className="l-shot-night" src={image.night} alt={alt} loading="lazy" />
    </>
  );
}

// "Inside the app": one row per screen. Pointing at a row lifts it into a card
// with an orange title, so it reads as a button. Clicking it opens its details
// right under it (the rows below slide down; grid rows 0fr → 1fr) and the
// row's circle becomes a minimise button; clicking it again closes it. One row
// is open at a time: opening a row below an open one closes that one, and
// while it folds away the page scrolls with it, so the row you clicked stays
// where it was and opens downwards instead of riding up the screen.
const FOLD_MS = 700; // a little longer than the 0.6 s fold in landing.css

export default function AppTour() {
  const [openIndex, setOpenIndex] = useState(null);
  const holdRef = useRef(0);

  function toggle(i, row) {
    const next = openIndex === i ? null : i;
    if (openIndex !== null && next !== null && openIndex < i) {
      cancelAnimationFrame(holdRef.current);
      const anchor = row.getBoundingClientRect().top;
      const until = performance.now() + FOLD_MS;
      const hold = (now) => {
        const drift = row.getBoundingClientRect().top - anchor;
        if (Math.abs(drift) > 0.5) scrollBy({ top: drift, behavior: 'instant' });
        if (now < until) holdRef.current = requestAnimationFrame(hold);
      };
      holdRef.current = requestAnimationFrame(hold);
    }
    setOpenIndex(next);
  }

  return (
    <section id="app" className="l-section l-app" aria-labelledby="l-app-title">
      <div className="l-container">
        <UpperTitle>Inside the app</UpperTitle>
        <h2 id="l-app-title" className="visually-hidden">
          Inside the app
        </h2>
        <ul className="l-rows">
          {SCREENS.map((s, i) => {
            const open = openIndex === i;
            return (
              <li key={s.title} className={`l-row-item ${open ? 'is-open' : ''}`}>
                <button
                  id={`l-row-${i}`}
                  type="button"
                  className="l-row"
                  aria-expanded={open}
                  aria-controls={`l-detail-${i}`}
                  onClick={(e) => toggle(i, e.currentTarget)}
                >
                  <span className="l-row-meta">
                    <Icon name={s.icon} size={40} />
                    <span className="l-tags">
                      {s.tags.map((tag) => (
                        <span key={tag} className="l-tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="l-row-title">{s.title}</span>
                  <span className="l-row-circle" aria-hidden="true">
                    <Icon name={open ? 'minimize' : 'expand'} size={18} />
                  </span>
                  <span className="visually-hidden">{open ? ': hide details' : ': show details'}</span>
                </button>
                <div id={`l-detail-${i}`} className="l-detail" role="region" aria-labelledby={`l-row-${i}`} inert={!open || undefined}>
                  <div className="l-detail-inner">
                    <div className="l-detail-body">
                      <div className="l-detail-text">
                        <p className="l-upper">What it does</p>
                        <p>{withNoto(s.does)}</p>
                        <p className="l-upper">Why it helps</p>
                        <p>{withNoto(s.helps)}</p>
                      </div>
                      <div className="l-detail-shot">
                        <ThemeImage image={s.image} alt={s.alt} />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
