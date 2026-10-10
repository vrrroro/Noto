// "Noto" inside running text, set like the logo (Playfair italic), so the
// name reads as the brand wherever it appears in a sentence.
export function NotoWord() {
  return <span className="noto-word">Noto</span>;
}

// A plain string with every "Noto" in it set as the logo.
export function withNoto(text) {
  const parts = text.split(/\bNoto\b/);
  return parts.flatMap((part, i) => (i === 0 ? [part] : [<NotoWord key={i} />, part]));
}
