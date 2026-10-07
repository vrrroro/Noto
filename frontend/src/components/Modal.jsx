import { useEffect, useId, useRef } from 'react';
import Icon from './Icon.jsx';

// Accessible side sheet built on the native <dialog> element: showModal() makes
// the rest of the page inert, traps focus, closes on Escape and returns focus
// to the trigger. Desktop: slides in from the right; phones: rises as a bottom sheet.
export default function Modal({ open, title, label, onClose, children, size = 'md' }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
    >
      {open && (
        <div className="modal-body">
          <header className="modal-header">
            <div className="modal-heading">
              {label && <p className="label">{label}</p>}
              <h2 id={titleId}>{title}</h2>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
              <Icon name="close" size={20} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
