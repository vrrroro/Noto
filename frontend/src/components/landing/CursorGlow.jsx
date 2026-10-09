import { useEffect, useRef } from 'react';
import { damp, requestScrollFrame, useScrollFrame } from '../../hooks/useScrollFrame.js';

// A very faint purple light that follows the mouse across the landing page.
// It sits behind the content (z-index -1 inside the isolated .landing) and
// eases after the pointer through the shared loop, so it stops when the
// pointer does. Mouse only, and off under reduced motion.
export default function CursorGlow({ motion }) {
  const ref = useRef(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, on: false });

  useEffect(() => {
    if (!motion) return undefined;
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = pos.current;
      p.tx = e.clientX;
      p.ty = e.clientY;
      if (!p.on) {
        p.on = true;
        p.x = p.tx;
        p.y = p.ty;
        ref.current?.classList.add('is-on');
      }
      requestScrollFrame();
    };
    const onLeave = () => {
      pos.current.on = false;
      ref.current?.classList.remove('is-on');
    };
    addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [motion]);

  useScrollFrame((dt) => {
    const p = pos.current;
    if (!p.on) return undefined;
    return () => {
      p.x = damp(p.x, p.tx, 110, dt);
      p.y = damp(p.y, p.ty, 110, dt);
      ref.current.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      return Math.abs(p.x - p.tx) > 0.3 || Math.abs(p.y - p.ty) > 0.3;
    };
  }, motion);

  return <div ref={ref} className="l-cursor-glow" aria-hidden="true" />;
}
