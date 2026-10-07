// Haptic feedback on phones (Vibration API; silently unavailable elsewhere,
// including iOS Safari). Primary actions get a two-pulse pattern, other
// controls a single short tap.
const PATTERNS = {
  primary: [30, 60, 40],
  tap: 20,
};

const TARGETS = '.btn, .nav-link, .segmented button, .toast-close, .modal-close, .menu-toggle';

export function haptic(kind = 'tap') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap);
}

// One delegated listener for the whole app. `pointerup` from a touch counts as
// a user activation, which the Vibration API requires.
export function installHaptics(root = document) {
  root.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType !== 'touch') return;
      const control = event.target.closest?.(TARGETS);
      if (!control || control.disabled) return;
      haptic(control.classList.contains('btn-primary') ? 'primary' : 'tap');
    },
    { passive: true },
  );
}
