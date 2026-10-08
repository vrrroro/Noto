// Thin-line volt diagrams for the four steps. Drawn in their finished state;
// landing.css animates them on a loop only while their step is open (and only
// when motion is allowed).
const BOXES = [0, 1, 2, 3, 4, 5];

const SHAPES = {
  // Sign up: an email field draws from dotted to solid, then the six-digit code fills in.
  code: (
    <>
      <rect className="d-dash" x="10" y="16" width="420" height="58" rx="29" pathLength="1" />
      <path className="d-caret" d="M46 33v24" />
      {BOXES.map((i) => (
        <rect key={i} className="d-box" style={{ '--i': i }} x={22 + i * 70} y="104" width="52" height="52" rx="10" />
      ))}
    </>
  ),
  // Add subjects: three tags draw in, each with its colour dot.
  tags: (
    <>
      {[
        [10, 22, 176],
        [118, 92, 226],
        [214, 22, 216],
      ].map(([x, y, w], i) => (
        <g key={i} style={{ '--i': i }}>
          <rect className="d-tag" x={x} y={y} width={w} height="48" rx="24" pathLength="1" />
          <circle className="d-dot" cx={x + 30} cy={y + 24} r="7" />
          <path className="d-tag-line" d={`M${x + 52} ${y + 24}h${w - 84}`} pathLength="1" />
        </g>
      ))}
    </>
  ),
  // Track work: an assignment card gets ticked off and its line struck through.
  check: (
    <>
      <rect className="d-frame" x="10" y="18" width="420" height="137" rx="18" />
      <circle className="d-ring" cx="66" cy="86" r="24" />
      <path className="d-tick" d="M54 87l9 9 17-19" pathLength="1" />
      <path className="d-line" d="M114 72h236" pathLength="1" />
      <path className="d-line is-short" d="M114 102h150" pathLength="1" />
      <path className="d-strike" d="M108 72h250" pathLength="1" />
    </>
  ),
  // Keep notes: a file rises through a dotted path into the cloud.
  upload: (
    <>
      <path
        className="d-frame"
        d="M150 132h-14a38 38 0 0 1-4-75.7A58 58 0 0 1 244 44a44 44 0 0 1 64 33.5A28 28 0 0 1 304 132h-14"
      />
      <path className="d-path" d="M220 168V96" />
      <g className="d-file">
        <path d="M206 112h20l10 10v28h-30z" />
        <path d="M226 112v10h10" />
      </g>
    </>
  ),
};

export default function ProcessDiagram({ kind }) {
  return (
    <svg className={`l-diagram is-${kind}`} viewBox="0 0 440 173" aria-hidden="true" focusable="false">
      {SHAPES[kind]}
    </svg>
  );
}
