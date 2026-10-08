import { useEffect, useRef, useState } from 'react';
import LandingHeader from '../components/landing/LandingHeader.jsx';
import Hero from '../components/landing/Hero.jsx';
import RoastSection from '../components/landing/RoastSection.jsx';
import FeaturesSection from '../components/landing/FeaturesSection.jsx';
import StackSection from '../components/landing/StackSection.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import { useLandingMotion, usePrefersReducedMotion } from '../hooks/useLandingMotion.js';
import '../styles/landing.css';

// The public front page for signed-out visitors. The panels are dealt over
// each other as you scroll; see styles/landing.css for the choreography.
export default function Landing() {
  const rootRef = useRef(null);
  const motion = !usePrefersReducedMotion();
  const { tone, scrolled } = useLandingMotion(rootRef, motion);
  const [ready, setReady] = useState(false);

  // Start the opening sequence once the fonts are in (the boot loader lifts at the same moment).
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Noto: assignments, deadlines and notes in one place';
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    document.fonts?.ready.then(start);
    const fallback = setTimeout(start, 1300);
    return () => {
      clearTimeout(fallback);
      document.title = previousTitle;
    };
  }, []);

  return (
    <div ref={rootRef} className={`landing ${ready ? 'is-ready' : ''}`}>
      <LandingHeader tone={tone} motion={motion} />
      <div className="l-deck">
        <main id="l-main" className="l-main">
          <Hero />
          <RoastSection motion={motion} />
          <FeaturesSection />
          <StackSection />
        </main>
        <LandingFooter />
      </div>
      <a href="#top" className={`l-top ${scrolled ? 'is-visible' : ''}`} tabIndex={scrolled ? 0 : -1} aria-label="Back to top">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <div className="l-halo" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
