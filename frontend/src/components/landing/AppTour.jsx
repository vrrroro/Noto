import { useState } from 'react';
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
// row's circle becomes a minimise button; clicking again, or "Minimise" at the
// end of the details, closes it. One row is open at a time.
export default function AppTour() {
  const [openIndex, setOpenIndex] = useState(null);

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
            const close = () => {
              setOpenIndex(null);
              document.getElementById(`l-row-${i}`)?.focus({ preventScroll: true });
            };
            return (
              <li key={s.title} className={`l-row-item ${open ? 'is-open' : ''}`}>
                <button
                  id={`l-row-${i}`}
                  type="button"
                  className="l-row"
                  aria-expanded={open}
                  aria-controls={`l-detail-${i}`}
                  onClick={() => setOpenIndex(open ? null : i)}
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
                        <button type="button" className="l-detail-close" onClick={close}>
                          <Icon name="minimize" size={16} />
                          Minimise
                        </button>
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
