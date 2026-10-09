import { useEffect, useRef } from 'react';
import { requestScrollFrame, useScrollFrame } from '../hooks/useScrollFrame.js';

// Replaces the browser's scrollbar (hidden in global.css) on every page: a
// thin straight line on the right edge, filled in Noto orange down to the
// current scroll position, with a small orange pin at its tip. Click or drag
// anywhere along it to scroll there. It hides itself when the page does not
// scroll, and only does work while scrolling or resizing (the shared loop).
export default function ScrollPin() {
  const ref = useRef(null);

  useScrollFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    return () => {
      const el = ref.current;
      if (!el) return;
      el.classList.toggle('is-idle', max <= 4);
      el.style.setProperty('--progress', progress.toFixed(4));
    };
  });

  // Content that grows without a scroll (data arriving, images loading) moves the end.
  useEffect(() => {
    const observer = new ResizeObserver(() => requestScrollFrame());
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  function scrollToPointer(e) {
    const r = ref.current.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    scrollTo({ top: fraction * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' });
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
    ref.current.classList.add('is-dragging');
    scrollToPointer(e);
  }

  function onPointerMove(e) {
    if (ref.current.hasPointerCapture(e.pointerId)) scrollToPointer(e);
  }

  function onPointerUp(e) {
    ref.current.releasePointerCapture?.(e.pointerId);
    ref.current.classList.remove('is-dragging');
  }

  return (
    <div
      ref={ref}
      className="scroll-pin"
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="scroll-pin-track" />
      <span className="scroll-pin-fill" />
      <span className="scroll-pin-dot" />
    </div>
  );
}
