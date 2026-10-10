import { useEffect, useId, useRef, useState } from 'react';
import { SUBJECT_COLORS, SUBJECT_PALETTE } from '../utils/format.js';

// A round swatch button showing the chosen colour; it opens a small row of the
// six subject colours. Escape, a pick or a click elsewhere closes it, and
// focus goes back to the swatch.
export default function SubjectColorPicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(color) {
    onChange(color);
    setOpen(false);
    buttonRef.current?.focus();
  }

  // Arrow keys move between the swatches, as in any radio group.
  function onListKey(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = SUBJECT_COLORS[(SUBJECT_COLORS.indexOf(value) + step + SUBJECT_COLORS.length) % SUBJECT_COLORS.length];
    onChange(next);
    rootRef.current?.querySelector(`[data-color="${next}"]`)?.focus();
  }

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="color-swatch-btn"
        style={{ '--swatch': SUBJECT_PALETTE[value].css }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Subject colour: ${SUBJECT_PALETTE[value].label}. Change colour`}
        title="Subject colour"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="color-swatch" aria-hidden="true" />
      </button>
      {open && (
        <div id={listId} className="color-pop" role="radiogroup" aria-label="Subject colour" onKeyDown={onListKey}>
          {SUBJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={color === value}
              aria-label={SUBJECT_PALETTE[color].label}
              title={SUBJECT_PALETTE[color].label}
              tabIndex={color === value ? 0 : -1}
              data-color={color}
              className="color-option"
              style={{ '--swatch': SUBJECT_PALETTE[color].css }}
              onClick={() => pick(color)}
            >
              <span className="color-swatch" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
