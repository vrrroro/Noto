import { useEffect, useRef, useState } from 'react';

// Page opener: an optional mono label, the serif title with its vine (which
// ends in Noto's dot), a grey tagline, and a glass action bar. Once the
// header scrolls out of view, a compact glass bar keeps the actions in reach.
export default function PageHeader({ label, title, description, summary, actions }) {
  const headerRef = useRef(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!actions || !header || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [actions]);

  return (
    <>
      <header className="page-header" ref={headerRef}>
        <div className="page-title-block">
          {label && <p className="label">{label}</p>}
          <h1>{title}</h1>
          <svg className="page-vine" viewBox="0 0 320 24" aria-hidden="true" focusable="false">
            <path d="M0 14 C 36 2, 64 24, 104 13 S 172 1, 214 12 S 282 24, 312 11" />
            <circle cx="312" cy="11" r="4" />
          </svg>
          {description && <p className="tagline">{description}</p>}
        </div>
        {actions && (
          <div className="cta-bar">
            {summary && (
              <p className="cta-summary">
                <span>{summary[0]}</span>
                <span className="quiet">{summary[1]}</span>
              </p>
            )}
            <div className="page-actions">{actions}</div>
          </div>
        )}
      </header>

      {actions && (
        <div className={`page-sticky ${scrolledPast ? 'is-visible' : ''}`} inert={!scrolledPast}>
          <span className="page-sticky-title">{title}</span>
          <div className="sticky-actions">{actions}</div>
        </div>
      )}
    </>
  );
}
