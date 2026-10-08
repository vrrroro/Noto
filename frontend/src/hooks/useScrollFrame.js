import { useEffect, useRef, useState } from 'react';

// One requestAnimationFrame loop for every scroll-linked effect on the landing
// page. Callbacks run at most once per frame, only while the page is scrolling
// or resizing, or while one of them asks for another frame.
// A callback reads layout and returns a "write" function; all reads happen
// before any write, so a frame costs a single layout pass. The write (or the
// callback itself) returns true while it is still easing towards its target.
const callbacks = new Set();
let frame = 0;
let last = 0;

function tick(now) {
  frame = 0;
  const dt = last ? Math.min(64, now - last) : 16;
  last = now;
  let again = false;
  const writes = [];
  for (const cb of callbacks) {
    const result = cb(dt);
    if (typeof result === 'function') writes.push(result);
    else if (result === true) again = true;
  }
  for (const write of writes) if (write() === true) again = true;
  if (again) schedule();
  else last = 0;
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick);
}

function attach() {
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
}

function detach() {
  removeEventListener('scroll', schedule);
  removeEventListener('resize', schedule);
  cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
}

export function useScrollFrame(callback, enabled = true) {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const cb = (dt) => ref.current(dt);
    if (!callbacks.size) attach();
    callbacks.add(cb);
    schedule();
    return () => {
      callbacks.delete(cb);
      if (!callbacks.size) detach();
    };
  }, [enabled]);
}

// Wake the loop from outside a scroll event (pointer moves, layout changes).
export const requestScrollFrame = schedule;

// Frame-rate independent easing towards a target ("scrub" smoothing).
// `tau` is the time constant in ms: about 63% of the way there after tau.
export function damp(current, target, tau, dt) {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

const REDUCED = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(REDUCED).matches);
  useEffect(() => {
    const query = matchMedia(REDUCED);
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}
