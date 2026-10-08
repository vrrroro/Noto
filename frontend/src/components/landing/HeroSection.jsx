import IconButton from './IconButton.jsx';

// The page arrives fully composed: no entrance animation. A grey line resolving
// into an ink line, bottom-aligned, with the sub-copy on the same floor.
export default function HeroSection() {
  return (
    <section id="top" className="l-hero" aria-labelledby="l-hero-title">
      <div className="l-container l-grid l-hero-grid">
        <h1 id="l-hero-title" className="l-h1">
          <span className="l-grey">Your semester,</span>
          <br />
          sorted.
        </h1>
        <div className="l-hero-side">
          <p className="l-text-large">
            Noto keeps your assignments, deadlines and notes in one place, so the evening goes on the work and not on
            finding it.
          </p>
          <IconButton to="/register">Create your account</IconButton>
        </div>
      </div>
    </section>
  );
}
