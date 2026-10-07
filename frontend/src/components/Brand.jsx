// The Noto wordmark. The orange dot is the product's signature: the same dot
// marks the active page, toggles completion and lands on the progress line.
export default function Brand() {
  return (
    <span className="brand-word">
      Noto
      <span className="brand-dot" aria-hidden="true" />
    </span>
  );
}
