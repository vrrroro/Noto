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
- [x] **T13. Wrap-up.** Update `e2e/landing-motion.mjs` for the new behaviour, run all tests,
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

**T13 (done).** `e2e/landing-motion.mjs` rewritten for the new page: 32/32 (orb colours and merge
per theme, aligned negative copies, ball-only top bar, HUD brand drawing, glider, underglow,
drift without clipping, "Under the hood" never passing through "How it works", AWS tiles, scroll
pin, plus the old card, timeline, panel, route, idle and reduced-motion checks). `e2e/run.mjs`
clicks the moved Sign in link: 32/32 in demo mode. Frontend unit 19/19, production build OK.
Fixed on the way: the cursor glow wrote to its element after a route change (null guard); the
far-jump now fades the page and lifts only the target section. New `e2e/app-screens.mjs`
regenerates the "Inside the app" images. Docs updated: CHANGELOG, PROJECT_CONTEXT, TESTING,
README, HANDOFF, CLAUDE.md. The docs screenshots (`docs/screenshots/*`) were regenerated by
`run.mjs`. Merged into `main` and deployed to Amplify (`deploy.ps1 -FrontendOnly`) on 2026-10-10 at the owner's request; verified live: landing motion 32/32, live site 17/17.

## Round 4 (2026-10-11, branch `feature/landing-round4`, not deployed)

Owner's list, all done and checked locally (landing motion 38/38, demo E2E 34/34, unit 19/19):

- Top-left orange ball removed from the top bar (and the orange haze in the hero's corner).
- Nav glider: no spring overshoot, so it stays inside "Under the hood" (test samples the slide).
- First-load intro: grey page, the dot falls like a water drop (physics in `dropIntro.js`), its
  impact sends one Day/Night-style circle reveal that brings the colour back; settles in ~1.4 s.
- How it works: 01–04 evenly spaced along the line, 04 at its end; the open step's body sits
  beside the list (desktop) or under it (tablet, phone).
- No "student"/"project" on the page; footer credit "This was bloomed by Rohit".
- "Back to home" on the sign-in pages; the closing "Sign in" button's word sits inside its pill.
- Inside the app: no hover effect, click opens the panel. "Free, private, any browser." card removed.
- Sign-up diagram: mouse pointer instead of a blinking text caret.

## Round 5 (2026-10-11, branch `feature/landing-round5`, from `feature/landing-round4`, not deployed)

Owner's list, in their order. Local only: do **not** merge into `main` and do **not** deploy to
Amplify. Each box is ticked (and committed) as soon as it is done and checked locally, so any
agent can resume from the first `[ ]`. Same rules as above (no new dependencies, Noto orange
`#ff6b35`, Playfair/Archivo/Geist Mono, no yellow, reduced motion off, no Claude co-author line).

- [x] **R5-1. Smooth dot glow.** After the drop, the orange dot's glow must not snap to a lower
  brightness: no sudden jumps in the glow at any point (during the bounce or when it settles).
- [x] **R5-2. Grey only on the wordmark.** The first-load monochrome is limited to the big "Noto"
  word (not the whole page). The word starts grey, and after the dot finishes bouncing a ripple
  from the dot gives the word back its colour.
- [x] **R5-3. Fuller sections, Noto in the logo font.** Less empty space around the content in
  every section (wider/larger content, tighter padding). Every "Noto" inside running text is set
  in the logo's font (Playfair, like the wordmark).
- [x] **R5-4. How it works: body under the step again.** Go back to the earlier design where each
  step's animation/text opens under its title, but keep 01–04 equally spaced along the line.
- [x] **R5-5. Inside the app hover.** Hovering a row (Dashboard, Assignments …) highlights the
  whole row card so it reads as a button, and its title turns orange. Click still expands.
- [x] **R5-6. Footer.** Remove the closing "Sign in" button at the end of the page; centre
  "This was bloomed by Rohit".
- [x] **R5-7. Built on AWS tiles.** The orbs live inside the cards, not behind them: one very
  subtle orange→purple gradient stretched across all four cards (from "Sign in, handled" to
  "Served and watched"). Fix the 4th card (Amplify/CloudWatch) so its header lines up with the
  other three.
- [x] **R5-8. Hero tagline higher.** Move "Your semester, sorted." up a little (properly spaced,
  not much).
- [x] **R5-9. Even section spacing.** Equal, appropriate spacing between every section (the gap
  between "Built on AWS" and "Inside the app" is too big).
- [x] **R5-10. Progress bar overshoot (app).** At 100% complete the progress bar's stretch
  animation must stay inside its track and not run into the "100%" label.
- [x] **R5-11. App theme switch.** Remove the "System" theme option. The app's Day/Night switch
  uses the landing page's circle reveal (growing outward from the button).
- [x] **R5-12. Greeting name.** "Hello, <name>" must not just use the part of the email before
  "@": use the account's real name (Cognito `name`/`given_name`) and fall back sensibly.
- [x] **R5-13. Upcoming / Recent files panels.** Their background is a different shade from the
  page and the edges look janky: make them sit cleanly on the background.
- [x] **R5-14. Subject colours.** When adding (and editing) a subject, a button next to it lets you
  pick the subject's colour from 6 colours; the colour is saved and shown.
- [x] **R5-15. Softer glow.** Tone down the glow of all glowing buttons (New subject, New
  assignment, …) by 20%, and the Noto orb inside the app by 20%.
- [x] **R5-16. Sign-in page fits one screen.** Everything visible without scrolling; the
  "Assignments, deadlines and notes, kept in one place." text must not overlap the animation;
  remove the three bullet points ("See what is due next", "Keep notes together by subject",
  "Open them from any browser").
- [x] **R5-17. Home button and signed-in landing.** In the app, a "Home" button to the left of
  "Sign out" goes to the top of the landing page. When signed in, the landing page shows "Signed
  in" with a round avatar (the account's initial) instead of "Sign in"/"Create account"; clicking
  it opens a menu: Dashboard, Assignments, Subjects, Notes, Sign out.
- [x] **R5-18. Open into the dashboard.** When signed in, opening the site (`/`) goes straight to
  the dashboard. The landing page shows only when the user clicks Home (or is signed out).
- [x] **R5-19. Night orbs.** In Night the scroll orbs use the same orange and dark purple as Day,
  but swapped: purple on the left, orange on the right.
- [x] **R5-20. Wrap-up.** Update the E2E checks, run all tests, update CHANGELOG / PROJECT_CONTEXT /
  HANDOFF, commit and push the branch, run locally. No Amplify deploy, no merge.

### Round 5 notes

(Filled in as tasks are finished: what changed, where, how it was checked.)

- R5-1: the glow's breathing keyframes (`l-glow`, landing.css) now start and end at the resting
  glow (opacity 1, scale 1) and dip to 0.7 / 1.18, so nothing jumps when the breathing starts at
  1.9 s. Checked with frame captures.
- R5-2: `dropIntro.js` no longer puts a grey layer over the page. It clones the four letters into
  `span.l-mark-mono` (greyed with `filter: grayscale(1)`, laid exactly over the real ones, its
  rise animations synced to the real letters' start time), and when the last bounce ends one
  ripple (`--l-r` on its mask, 700 ms, same easing as the Day/Night switch) spreads from the dot
  and removes the copy. Checked with frame captures in Day and Night.
- R5-3: `--l-section` 7.5rem → 5rem (one gap for every section); About text wider (cols 4–12) and
  larger; feature cards wider (cols 3–11), taller, larger text; AWS stage and app rows pulled up.
  New `components/NotoWord.jsx` (`<NotoWord />`, `withNoto(text)`) + `.noto-word` in global.css:
  every "Noto" in running text (hero, About, closing line, intro statement, step and panel copy,
  footer ©, dashboard empty state) is in Playfair italic like the logo.
- R5-4: steps get equal quarters of the list (`flex: 1 1 0`); the open step's text and diagram sit
  under its title (side by side on desktop, stacked on tablet/phone); the title row shrinks on short
  screens (`--l-row: clamp(3.5rem, 9vh, 5rem)`); the line ends at 04's dot (`bottom: 25% - row/2`).
  Checked at 1440×900, 1280×720, 768×1024, 390×844.
- R5-5: `.l-row::before` is a card (border, radius, soft shadow) that fades in on hover/focus; the
  title turns orange and the circle fills purple. No layout shift. Checked in Night.
- R5-6: closing "Sign in" button and `.l-app-cta` removed; footer credits are a 1fr/auto/1fr grid
  so "This was bloomed by Rohit" is centred (stacked and centred on phones).
- R5-7: orbs removed from the AWS tiles (and StackSection's pointer tracking); each tile paints its
  quarter of one soft orange→purple gradient (`color-mix` at `--i × 25%`). Tiles are top-aligned
  (icon, then text from a fixed line), so every service name/title lines up.
- R5-8: hero gap `clamp(2rem, 9svh, 6rem)`: the headline sits ~45px higher at 900px tall.
- R5-9: section gaps measured (`main > section` content edges): 160px between sections at 1440;
  the About section pulls up into the intro's empty half screen (`margin-top: calc(-50svh + 10rem
  + 2 × --l-section)`) under motion.
- R5-19: Night orbs use the Day colours swapped: dark purple orb on the left, Noto orange on the
  right (white ink on both); the lens stays greyish purplish black.
- R5-10: the meter's spring now runs on a registered `--meter` number and the fill/dot read
  `min(--meter, 100)`, with the dot kept inside the track: it can stretch but never past the end.
  Checked: 0 px past the track end while animating to 100%.
- R5-11: `useTheme` has only `light`/`dark` (first visit follows the system once). New
  `switchTheme(next, origin, setTheme)` (view transition + circle clip from the clicked button) is
  used by the landing switch and the app sidebar; the view-transition CSS moved to global.css.
- R5-12: sign-up asks for a Name, saved as Cognito's standard `name` attribute (no pool change);
  the session reads the ID token's `name` claim. Dashboard greets by its first word; an account with
  no name sees "Hello, there" and a one-line "What should we call you?" form (Cognito
  `UpdateUserAttributes` with the user's own access token, then a token refresh). Demo auth mirrors it.
- R5-13: the dashboard's `.band` (a second-shade strip with hard edges) is gone; the panels sit on
  the page background.
- R5-14: six colours (`SUBJECT_COLORS` in backend constants: violet, magenta, cyan, yellow, blue,
  green). `SubjectColorPicker` (swatch in the add bar, radio group popover, arrow keys, Escape).
  Backend `POST /subjects` accepts and stores an optional validated `color` (+ test). **The live
  Lambda is not redeployed**, so against the live API the pick is remembered in this browser
  (`scm.subjectColors`) until the backend is deployed. Subjects without a pick keep the rotation.
- R5-15: `--glow-button` and `--glow-dot` alphas × 0.8.
- R5-16: auth-points removed; at ≥1200px the arch, heading and card are sized from the screen
  height, the heading sits under the arch. Sign-in has no scroll at 1280×720, 1366×768, 1440×900,
  1920×1080. (Sign-up, with its extra fields, may still scroll on short screens.)
- R5-17: sidebar has Home (left of Sign out) → `/home`. The landing page, when signed in, shows the
  switch and `AccountMenu` ("Signed in" + initial): Dashboard, Assignments, Subjects, Notes, Sign out
  (phone menu too); About's CTA and the footer's Account column switch to app links.
- R5-18: `/` = dashboard when signed in, landing when signed out; `/home` = landing for everyone
  (App.jsx). Sign-in still lands on the dashboard.
- R5-20: landing-motion.mjs 41/41 (new: grey wordmark only, ripple after the last bounce, swapped
  Night orbs, AWS tint + aligned headers, steps under titles, row hover card, centred footer);
  run.mjs 38/38 on a demo server (name field; Day/Night only; Home; account menu; `/` opens the
  dashboard); backend 37/37; frontend unit 20/20; production build OK. Docs updated (CHANGELOG,
  PROJECT_CONTEXT, HANDOFF, CLAUDE.md). Branch pushed; not merged, not deployed.

## Round 6 (2026-10-11, branch `feature/round6`, from `feature/landing-round5`)

Owner's list, in their order. This round ends with a merge into `main` and an Amplify deploy
(asked for by the owner). Each box is ticked and committed when done and checked locally.

- [x] **R6-1. Faster drop, sooner ripple, slow colour.** The orb falls faster and the ripple
  starts sooner, but the "Noto" word still takes its colour back slowly.
- [x] **R6-2. Slower HUD brand.** In the scrolled HUD, the ball, then its line, then "Noto"
  appear a little more slowly.
- [x] **R6-3. Night negative text.** In Night, where the orbs pass over the statement, the text
  shows in negative white/black exactly like Day.
- [x] **R6-4. Inside the app expands inline.** Clicking a row (Dashboard …) pushes the content
  below down and shows the details under it (no popup), with a minimise button to close it.
- [x] **R6-5. How it works: bigger animations.** Diagrams under the text, bigger than now, with
  proper spacing.
- [x] **R6-6. Theme switch position.** Top bar: right of the section links, left of "Sign in".
  Scrolled HUD: inside the capsule, after "Under the hood", with a "|" divider before it.
- [x] **R6-7. Copy.** "We built Noto" → "I built Noto" (solo project).
- [x] **R6-8. App account menu.** Remove the sidebar's Home button; clicking the account opens a
  dropdown: Rename (first), Home, Sign out.
- [x] **R6-9. Sign-in page left half.** Arch and text centred in the left half, the vine animation
  slower, and both larger, with proper spacing (still one screen).
- [x] **R6-10. Subject colour button.** Sits to the left of "Add subject", with a small "V"
  chevron under the colour orb; the six colours drop down with an animation.
- [x] **R6-11. Automatic subject colour.** If no colour is picked by hand, the picker moves on to
  the next colour automatically (not always violet).
- [x] **R6-12. Meter elasticity back.** The 100% bar springs (overshoots and settles) like before,
  but never touches the "100%" label.
- [x] **R6-13. Ship.** Tests, docs, merge into `main`, push, deploy to Amplify, verify live.

### Round 6 notes

- R6-1: `dropIntro.js`: fall 0.42 → 0.30 s, start delay 450 → 250 ms; the ripple starts at the
  first impact (~270 ms after the fall begins) and lasts 1.5 s (was 0.7 s), so the word's colour
  returns slowly while the dot is still bouncing.
- R6-2: HUD brand "show" transitions ~1.6× slower: line + slot 1.2 s, word in at 1.05 s, dot at
  1.15 s, line fades at 1.6 s.
- R6-3: the lens (merge) is the light purplish grey with black ink in both themes; orbs keep white
  ink, so Night shows the same white/black negative as Day.
- R6-4: `AppTour.jsx` has no `<dialog>`: each row toggles an inline `.l-detail` (grid rows 0fr→1fr,
  0.6 s; content fades/rises in), the circle becomes a minimise icon, and a "Minimise" button sits
  at the end of the details (focus returns to the row). One row open at a time. Test: pushes the
  next row down ~515 px.
- R6-5: the open step grows (accordion) with its text and a large diagram underneath (up to
  260 px tall on desktop); closed steps stay one even row each; the line ends at 04's dot via a
  measured `--last`.
- R6-6: top bar actions are [switch][Sign in][Create account]; the HUD capsule ends with a rule
  and the switch after "Under the hood"; the right pill keeps Sign in / Create account.
- R6-7: intro statement now starts "I built Noto".
- R6-8: new `AccountButton.jsx`: the sidebar's user box opens a menu upwards: Rename (a small
  modal, saves via `updateName`), Home (`/home`), Sign out. The separate Home/Sign out buttons are gone.
- R6-9: auth intro centred in its half (`justify-items: center`, centred heading), arch up to
  54dvh/540px, heading up to 64px, vine climb 2.6 s and the dot lands at 2.5 s. Sign-in still has
  no scroll at 1366×768.
- R6-10: the colour button sits between the input and "Add subject", with a chevron under the orb;
  the six colours drop down (scale/translate in, then each pops in 35 ms apart).
- R6-11: `nextSubjectColor(subjects)`: the least used of the six (first on a tie) is preselected
  and moves on after each new subject unless one is picked by hand (+ unit test).
- R6-12: the meter springs again (transform/left with `--ease-spring`), on a track that stops 11%
  short so the peak overshoot stays ~46 px clear of the "100%" label.
- R6-13: merged `feature/round6` (which carries rounds 4 and 5) into `main` (fast-forward), pushed.
  Backend: `sam deploy` (samconfig's changeset prompt cannot be answered non-interactively, so
  `--no-confirm-changeset`; changeset was code-only: 3 Lambdas + HttpApi modified, no
  replacements). Website: `deploy.ps1 -FrontendOnly`. The live site test caught a real bug: a long
  email widened the new account button and the sidebar footer over the page (invisible rows
  intercepting clicks); fixed (`grid-template-columns: minmax(0, 1fr)`, `.account { min-width: 0 }`)
  and redeployed, with a demo E2E check. Verified live: API 46/46 (incl. subject colour saved /
  bad colour rejected), website 17/17, landing motion 42/42.
