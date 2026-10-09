import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import IconButton, { UpperTitle } from './IconButton.jsx';
import { SCREENS } from './content.js';

// "Inside the app": one row per screen. Hovering a row (mouse only) turns the
// title orange, fills its circle, and shows a frosted preview that follows the
// pointer; activating a row opens a side panel (a native modal <dialog>, so
// focus is trapped, Escape closes it and focus returns to the row).
export default function AppTour() {
  const [hovered, setHovered] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const previewRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (openIndex !== null && !dialogRef.current.open) dialogRef.current.showModal();
  }, [openIndex]);

  function movePreview(e) {
    const card = previewRef.current;
    if (!card || e.pointerType !== 'mouse') return;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    // Below-right of the pointer, flipped to the other side near the window edges.
    const x = e.clientX + 24 + w > innerWidth ? e.clientX - 24 - w : e.clientX + 24;
    const y = e.clientY + 24 + h > innerHeight ? e.clientY - 24 - h : e.clientY + 24;
    card.style.transform = `translate(${x}px, ${y}px)`;
  }

  function open(i, trigger) {
    triggerRef.current = trigger;
    setHovered(null);
    setOpenIndex(i);
  }

  function onClose() {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }

  const screen = openIndex === null ? null : SCREENS[openIndex];
  const preview = hovered === null ? null : SCREENS[hovered];

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
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return;
                  movePreview(e);
                  setHovered(i);
                }}
                onPointerMove={movePreview}
                onPointerLeave={() => setHovered(null)}
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

        <div className="l-app-cta">
          <IconButton to="/login" variant="hot" className="l-underglow">
            Sign in
          </IconButton>
        </div>
      </div>

      <div ref={previewRef} className={`l-preview ${preview ? 'is-on' : ''}`} aria-hidden="true">
        {preview && (
          <>
            <p>{preview.tagline}</p>
            <img src={preview.image} alt="" />
          </>
        )}
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
              <p>{screen.does}</p>
              <p className="l-upper">Why it helps</p>
              <p>{screen.helps}</p>
              <img src={screen.image} alt={screen.alt} />
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
