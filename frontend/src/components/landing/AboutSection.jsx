import IconButton, { UpperTitle } from './IconButton.jsx';

export default function AboutSection() {
  return (
    <section className="l-section l-about" aria-labelledby="l-about-title">
      <div className="l-container l-grid">
        <UpperTitle>Who it’s for</UpperTitle>
        <div className="l-about-text">
          <h2 id="l-about-title" className="visually-hidden">
            Who Noto is for
          </h2>
          <p className="l-text-large">
            Noto is a student workspace that lives in the cloud. Sign in from a laptop in the library or a phone on the
            bus, and your assignments, subjects and notes are already there.
          </p>
          <p className="l-text-large">
            It does a few things and does them properly. No feeds, no streaks, no clutter: just what is due, what is
            done, and the files you need to do it.
          </p>
          <IconButton to="/register">Make your account</IconButton>
        </div>
      </div>
    </section>
  );
}
