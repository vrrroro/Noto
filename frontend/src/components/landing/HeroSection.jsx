import NotoMark from './NotoMark.jsx';

// A full first screen: the headline (grey line resolving into an ink line,
// "sorted." in the purple gradient) and the sub-copy on top, the animated
// Noto wordmark filling the floor beneath them. Signing up lives in the nav.
export default function HeroSection({ motion }) {
  return (
    <section id="top" className="l-hero" aria-labelledby="l-hero-title">
      <div className="l-container l-grid l-hero-grid">
        <h1 id="l-hero-title" className="l-h1">
          <span className="l-grey">Your semester,</span>
          <br />
          <em>sorted.</em>
        </h1>
        <div className="l-hero-side">
          <p className="l-text-large">
            Noto keeps your assignments, deadlines and notes in one place, so the evening goes on the work and not on
            finding it.
          </p>
        </div>
      </div>
      <NotoMark motion={motion} />
    </section>
  );
}
