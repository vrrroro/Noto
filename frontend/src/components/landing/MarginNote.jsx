// A hand-drawn arrow that draws itself once (stroke-dashoffset), coloured with
// currentColor. One shape serves every direction: callers rotate and flip it
// with the --arrow-rot / --arrow-sx / --arrow-sy custom properties.
export function Arrow({ className = '', style }) {
  return (
    <svg className={`l-arrow ${className}`} style={style} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M8 22 C 30 4, 60 6, 63 27 C 66 47, 40 50, 44 33 C 48 17, 90 27, 95 93" />
      <path pathLength="1" d="M82 80 L 95.5 95 L 106 78" />
    </svg>
  );
}

// A margin note: a few words in the serif italic, rotated like ink on paper,
// with an arrow pointing at the thing it is about. Decorative, so hidden from
// assistive technology; anything it says must also be said in the page copy.
export default function MarginNote({ text, className = '', arrow, style }) {
  return (
    <span className={`l-note ${className}`} style={style} aria-hidden="true" data-reveal>
      <span className="l-note-text">{text}</span>
      {arrow && <Arrow style={arrow} />}
    </span>
  );
}
