// The landing page's small wordmark: at the top of the page only the orange
// ball shows (the big hero wordmark is the logo there). Once the hero
// wordmark is entirely off the screen, the nav gets .is-branded and this
// plays by itself (--b runs 0 → 1 over 1.08 s, landing.css): the word slot
// opens and the ball rides a vine line that draws itself, then "Noto" rises in
// behind it and the line fades, leaving "Noto" with its dot on the baseline,
// as in the big logo. When the hero
// wordmark comes back into view it plays back the other way.
// `hideIdle` hides the ball as well until the brand starts (the phone bar's
// copy, so nothing sits in the corner at the top of the page).
export default function HudBrand({ hideIdle = false, className = '' }) {
  return (
    <a href="#top" className={`l-hud-brand ${hideIdle ? 'is-hide-idle' : ''} ${className}`} aria-label="Noto, back to top">
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
