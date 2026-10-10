// The landing page's small wordmark. At the top of the page only the orange
// ball is shown (the big hero wordmark is the logo there). Once the page has
// been scrolled a little (`shown`), the word slot opens and the ball travels
// along a vine line that draws itself, like the vine that ends in the dot on
// the sign-in page; "Noto" then rises in behind it and the line fades away,
// leaving "Noto" with its dot. Scrolling back to the top reverses it.
// `hideIdle` hides the ball as well until the brand is shown (the top bar's
// copy, so nothing sits in the corner at the top of the page).
export default function HudBrand({ shown, hideIdle = false, className = '' }) {
  const hidden = hideIdle && !shown;
  return (
    <a
      href="#top"
      className={`l-hud-brand ${shown ? 'is-shown' : ''} ${className}`}
      aria-label="Noto, back to top"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <span className="l-hud-slot">
        <span className="l-hud-word">Noto</span>
        <svg className="l-hud-vine" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M1 18 C 22 4, 44 24, 66 12 S 90 6, 99 16" pathLength="1" />
        </svg>
      </span>
      <span className="l-hud-dot" aria-hidden="true" />
    </a>
  );
}
