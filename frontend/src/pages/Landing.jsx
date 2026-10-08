import { useEffect, useRef } from 'react';
import LandingNav from '../components/landing/LandingNav.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import IntroSlab from '../components/landing/IntroSlab.jsx';
import AboutSection from '../components/landing/AboutSection.jsx';
import FeatureStack from '../components/landing/FeatureStack.jsx';
import ProcessTimeline from '../components/landing/ProcessTimeline.jsx';
import StackSection from '../components/landing/StackSection.jsx';
import AppTour from '../components/landing/AppTour.jsx';
import LandingFooter from '../components/landing/LandingFooter.jsx';
import { usePrefersReducedMotion } from '../hooks/useScrollFrame.js';
import '../styles/landing.css';

// The public front page for signed-out visitors: quiet precision on an
// off-white page, with Noto's volt yellow as the signal and orange for hover.
// All motion is scroll-linked or pointer-linked; nothing plays on its own.
export default function Landing() {
  const rootRef = useRef(null);
  const motion = !usePrefersReducedMotion();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Noto: assignments, deadlines and notes in one place';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  // One-shot reveals for [data-reveal] blocks.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    rootRef.current.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`landing ${motion ? 'has-motion' : ''}`}>
      <LandingNav />
      <main id="l-main">
        <HeroSection />
        <IntroSlab motion={motion} />
        <AboutSection />
        <FeatureStack motion={motion} />
        <ProcessTimeline motion={motion} />
        <StackSection motion={motion} />
        <AppTour />
      </main>
      <LandingFooter />
    </div>
  );
}
