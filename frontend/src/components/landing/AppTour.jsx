import { useEffect, useRef, useState } from 'react';
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
      <img className="l-shot-day" src={image.day} alt={alt} />
      <img className="l-shot-night" src={image.night} alt={alt} />
    </>
  );
}

// "Inside the app": one row per screen. Pointing at a row lifts it into a card
// with an orange title, so it reads as a button; clicking it opens a side panel (a native modal <dialog>, so focus is trapped, Escape
// closes it and focus returns to the row).
export default function AppTour() {
  const [openIndex, setOpenIndex] = useState(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (openIndex !== null && !dialogRef.current.open) dialogRef.current.showModal();
  }, [openIndex]);

  function open(i, trigger) {
    triggerRef.current = trigger;
    setOpenIndex(i);
  }

  function onClose() {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }

  const screen = openIndex === null ? null : SCREENS[openIndex];

  return (
    <section id="app" className="l-section l-app" aria-labelledby="l-app-title">
      <div className="l-container">
        <UpperTitle>Inside the app</UpperTitle>
        <h2 id="l-app-title" className="visually-hidden">
          Inside the app
        </h2>
        <ul className="l-rows">
          {SCREENS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className="l-row"
                aria-label={`${s.title}: more details`}
                onClick={(e) => open(i, e.currentTarget)}
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
                <span className="l-row-circle">
                  <Icon name="expand" size={18} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="l-popup"
        aria-labelledby="l-popup-title"
        onClose={onClose}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
      >
        {screen && (
          <>
            <div className="l-popup-head">
              <div>
                <h3 id="l-popup-title" className="l-h3">
                  {screen.title}
                </h3>
                <span className="l-tags">
                  {screen.tags.map((tag) => (
                    <span key={tag} className="l-tag is-accent">
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
              <button type="button" className="l-popup-close" onClick={() => dialogRef.current.close()}>
                Close
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="l-popup-body">
              <p className="l-upper">What it does</p>
              <p>{withNoto(screen.does)}</p>
              <p className="l-upper">Why it helps</p>
              <p>{withNoto(screen.helps)}</p>
              <ThemeImage image={screen.image} alt={screen.alt} />
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
