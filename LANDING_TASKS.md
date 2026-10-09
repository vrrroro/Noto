# Landing page round 3: task list

Requested by the owner on 2026-10-10. Work happens on branch **`feature/landing-flow`** (from `main`
at `551e861`, which is what is deployed on Amplify). Each task is ticked here **and committed** as
soon as it is done and checked, so any agent can pick up from the first unticked box.

How to resume: `git checkout feature/landing-flow`, read this file, `CLAUDE.md` and `HANDOFF.md`,
start the dev server (`cd frontend && npm run dev`, http://localhost:5173, sign out to see the
landing page), then continue with the first `[ ]`.

Rules that apply to every task: no new dependencies; keep the Noto orange `#ff6b35` identical in
both themes; Day = everything light, Night = everything dark purple, never a mix; reduced motion
turns motion off; the shared rAF loop (`hooks/useScrollFrame.js`) must stop when idle (the
landing-motion E2E checks it); never add a Claude co-author line to commits.

Legend: `[x]` done and checked in a browser · `[ ]` not started

---

## Tasks

- [x] **T1. One continuous purple flow, no slabs.** The middle of the page (intro orbs, "Who it's
  for", "What's inside", "How it works", "Built on AWS", "Inside the app") and the footer sit on
  one continuous purple gradient with no visible colour edges. Night: all dark purple. Day: all
  light. No dark slabs in Day, no light slabs in Night (remove the inset black slabs and the
  "negative" light slabs). The nav's dark-over-slab state goes away with them.
- [x] **T2. Intro orbs recoloured.** Night: one light-orange orb and one light-purple orb; where
  they merge, a greyish purplish black. Day: one dark-purple orb and one Noto-orange orb; where
  they merge, a lightish purplish grey. The statement still shows in negative where an orb or
  the merge passes over it.
- [x] **T3. "Built on AWS" glows only inside the tiles.** The two orb shapes become faded, soft
  light orbs (orange and purple) and only show through the four service tiles, never outside or
  behind the gaps.
- [x] **T4. Anchor bug.** Clicking "Under the hood" (or any in-page link) must glide to its section
  without first passing through / stopping in the pinned "How it works" section.
- [x] **T5. Hero wordmark drifts away without clipping.** When scrolling down, the big Noto
  letters spread and drift away seamlessly (fade out), with no cut edges.
- [x] **T6. Ambient cursor glow.** A very faint purple light follows the cursor on the landing
  page (mouse only, extremely subtle, both themes).
- [x] **T7. Roomier, fluid scrolled HUD.** The capsule nav shown after scrolling gets more
  spacing, a sliding hover highlight, and a better place for the Day/Night switch.
- [x] **T8. HUD logo animation.** No "Noto" text in the landing HUD at the top of the page, only
  the orange ball (the big hero wordmark is the logo). After scrolling down a bit, the ball draws
  a line (like the vine on the sign-in page) and the small "Noto" wordmark appears in the HUD.
- [x] **T9. Underglow.** "Create account" and "Sign in" on the landing page get a soft glowing
  underglow.
- [x] **T10. App light mode: no dark purple cards.** On the sign-in pages and in the app, cards that
  stay dark purple in Day (the `.invert` cards) become a light purple appropriate for Day.
- [x] **T11. Theme-matched app screenshots.** "Inside the app" shows Day screenshots in Day and
  Night screenshots in Night (taken after T10).
- [x] **T12. Orange pin line instead of the scrollbar.** Hide the browser scrollbar and show a
  thin straight orange line on the right that tracks the scroll position (and can be dragged).
- [ ] **T13. Wrap-up.** Update `e2e/landing-motion.mjs` for the new behaviour, run all tests,
  update CHANGELOG / PROJECT_CONTEXT / TESTING / README / HANDOFF, commit and push. Ask the owner
  before deploying.

---

## Notes per task

(Filled in as each task is done: what changed, where, and how it was checked.)

**T1 (done).** `landing.css`: tokens are now Day/Night pairs with fixed purples (`--l-purple`,
`--l-plum`, `--l-lilac`) and a mode-aware `--l-accent`; Night paper is dark purple `#110b20`.
`.landing` paints one tall `--l-flow` gradient (stops `--l-f0..f3` plus four soft glows) behind
everything; the intro slab element and its width scrub, the process slab background, the footer
background, all `.is-dark` / `.l-dark` / `data-nav="dark"` rules and the nav's dark detection are
gone. The capping card is lilac by Day, purple by Night (`--l-card-*`). The hero haze runs 40svh
past the hero and fades out. Checked with full-page screenshots in both themes: no edges.
Known follow-ups: the intro orbs still use the old difference look (T2); `e2e/landing-motion.mjs`
still expects the old nav dark state and the slab width (T13).

**T2 (done).** No blend modes any more. `IntroSlab.jsx` renders the statement once for real and
once inside each orb and inside a lens (`.l-orb-copy`); `landing.css` `.l-orbs` holds the colour
pairs (`--a*` orb a, `--b*` orb b, `--m*` the merge, `--*-ink` the negative text) and the
geometry (`--xa`, `--xb`, `--os` from `--k`). Each orb has `overflow: hidden`; a copy undoes its
orb's translate and scale so it lines up with the real words; the lens sits inside orb b at orb
a's offset, so it is exactly the intersection. Rings are outlines (not clipped). Checked in both
themes mid-merge: Night light orange + light purple, merge greyish purplish black; Day orange +
dark purple, merge lightish purplish grey; text aligned and inverted in every shape.

**T3 (done).** The `.l-lens` lozenges are gone. Each `.l-aws-card` has `overflow: hidden` and a
`::before` that paints one stage-wide picture of two faded radial orbs (orange `--aws-glow-hot*`,
purple `--aws-glow-violet*`), sized `100cqw` and shifted by the tile's index (`--i`, set in
`StackSection.jsx`; `.l-aws-stage` is a size container), so the orbs read as one pair seen
through four windows and never show in the gaps. Pointer drift still uses `--m` / `--d`. Below
992px the tiles scroll sideways, so each tile shows its own pair. Tiles lost the backdrop blur
(nothing behind them now). Checked in both themes.

**T4 (done).** Cause: a smooth scroll to `#aws` travels through the 400vh pinned `#how` section,
which fills the screen for most of the trip. New `components/landing/glide.js`: one delegated
click handler (installed in `pages/Landing.jsx`) for every `a[href^="#"]` except the skip link.
Near targets (within 1.2 screens) glide smoothly; far ones fade `#l-main` out (160 ms), jump
straight to the target and let it rise and fade back in (520 ms). Reduced motion jumps. The URL
hash is still updated. Checked with a probe: from the top, "Under the hood" goes y 0 → 8607 in one
step, never showing "How it works", and lands with `#aws` at the top.

**T5 (done).** Cause: the rise-in mask (`clip-path` on `.l-mark-mask`) stayed on after the rise
and cut the letters as they drifted, and the hero clipped its overflow. The mask is now only an
animation (`@keyframes l-mask`, filled backwards through the delay), so nothing clips after the
rise; `--i` / `--dy` moved to the mask element so both animations share timing. Letters and dot
fade with scroll (`opacity: clamp(0, 1.35 - p*1.6, 1)`). The hero no longer clips (done in T1).
Checked at scroll 150/300/450/600: clean drift and fade, no cut edges, `clip-path: none` after.

**T6 (done).** New `components/landing/CursorGlow.jsx` (mounted first in `pages/Landing.jsx`): a
fixed 640px radial light (`.l-cursor-glow`, 8-9% purple, `light-dark` pair) that eases after the
mouse through the shared loop and fades in/out on enter/leave. `.landing` got
`isolation: isolate` so the glow's `z-index: -1` puts it on the flow but under all content.
Mouse only; off under reduced motion. Checked in both themes; 0 animation frames once the pointer
stops.

**T7 + T8 (done together, same component).** `LandingNav.jsx` rewritten; nav CSS in
`landing.css` ("Navigation") rewritten. Top bar: the orange ball alone on the left, the section
links, a hairline, then the actions group (Sign in, Day/Night switch, Create account). After 50px
on desktop the HUD rises in (spring) as two glass pills (`.l-glass`, blur + 70% paper): the centre
one holds the brand and the section links with a glider (`.l-pill-glider`) that slides under the
hovered/focused link and otherwise rests on the section in view (scroll spy, `is-current`,
`aria-current`); the right one holds the same actions group, so the switch always sits between
Sign in and Create account. New `HudBrand.jsx`: only the ball until 160px of scroll, then the word
slot opens (grid 0fr→1fr) while an orange vine draws and carries the ball along, "Noto" rises in
and the vine fades; it reverses when scrolling back. On phones the bar keeps the ball/brand,
the switch and the menu (glass chips). Checked in both themes: top, HUD, mid-draw, drawn, hover
glider, section glider. (Note for screenshots: puppeteer `clip` scrolls the page; use full
viewport shots.)

**T9 (done).** `.l-underglow` in `landing.css`: a layered box-shadow (purple light with a warm
orange core beneath, plus a faint purple hairline) that grows on hover/focus; light-dark pairs for
both themes. Applied to every "Sign in" and "Create account" on the landing page: the nav's
actions group (top bar and HUD), the phone menu's Create account chip and the "Inside the app"
Sign in button. The top bar's Create account is now the same filled purple pill as the HUD's.
Checked in both themes.

**T10 (done).** Cause: `.invert` in `styles/global.css` deliberately took the opposite colour
scheme, so the sign-in card (`.auth-card.invert`) and the dashboard's "Next up" card
(`.next-card.invert`) stayed dark purple in Day (and turned light in Night). `.invert` now stays
in the page's scheme and is set apart by a gradient: light lilac `#f3edff → #e4d7ff` by Day, deep
plum `#2d1b4e → #1e1238` by Night. Checked every app page (sign-in, dashboard, assignments, notes,
subjects) in both themes from a demo-mode server (`appshots.mjs` in the session scratchpad; it
registers a demo user, so run it against `VITE_* =` empty on port 5174): no dark card in Day, no
light card in Night.

**T11 (done).** New screenshots, taken after T10 from a demo-mode server with a seeded "Rohit"
account, 1100x693 WebP like before: `frontend/src/assets/landing/{dashboard,assignments,notes,
subjects}-{light,dark}.webp` (the four old single-theme images are deleted). `content.js` gives
each screen `image: { day, night }`; `AppTour.jsx` renders both through `ThemeImage`
(`img.l-shot-day` / `img.l-shot-night`) and `landing.css` shows the one matching the theme (same
conditions as global.css), so the switch swaps them instantly. Checked: in Night the side panel
shows `dashboard-dark.webp` (Day copy `display: none`), in Day the reverse. To regenerate: run a
demo-mode server on 5174 and `appshots.mjs <dir> --webp` (session scratchpad; it registers
rohit@college.edu in each theme and shoots the four screens).

**T12 (done).** Site-wide (all routes). `global.css` hides the browser scrollbar
(`scrollbar-width: none` + `::-webkit-scrollbar`; the old `scrollbar-gutter` is gone, so
`clientWidth == innerWidth`). New `components/ScrollPin.jsx`, mounted in `App.jsx`: a fixed 14px
strip on the right with a faint 2px track, an orange fill scaled to the scroll progress and an
orange pin at the tip (`.scroll-pin*` in global.css; position from `--progress`, the dot uses
`top: calc(progress * (100% - 8px))` because `vh` inside the transform measured wrong). Click or
drag on it scrolls there (pointer capture). It hides when the page cannot scroll, re-measures on
body resize, and only works inside the shared scroll loop. On coarse pointers (touch) it is a
gauge only. Note: headless Chrome here reports `pointer: coarse`, so tests that click it must
force `pointer-events: auto`. Checked: click at 50% → scrollY = 50% of max; drag to 22% → 22%;
dot centred on the fill's tip.
