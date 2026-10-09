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
- [ ] **T4. Anchor bug.** Clicking "Under the hood" (or any in-page link) must glide to its section
  without first passing through / stopping in the pinned "How it works" section.
- [ ] **T5. Hero wordmark drifts away without clipping.** When scrolling down, the big Noto
  letters spread and drift away seamlessly (fade out), with no cut edges.
- [ ] **T6. Ambient cursor glow.** A very faint purple light follows the cursor on the landing
  page (mouse only, extremely subtle, both themes).
- [ ] **T7. Roomier, fluid scrolled HUD.** The capsule nav shown after scrolling gets more
  spacing, a sliding hover highlight, and a better place for the Day/Night switch.
- [ ] **T8. HUD logo animation.** No "Noto" text in the landing HUD at the top of the page, only
  the orange ball (the big hero wordmark is the logo). After scrolling down a bit, the ball draws
  a line (like the vine on the sign-in page) and the small "Noto" wordmark appears in the HUD.
- [ ] **T9. Underglow.** "Create account" and "Sign in" on the landing page get a soft glowing
  underglow.
- [ ] **T10. App light mode: no dark purple cards.** On the sign-in pages and in the app, cards that
  stay dark purple in Day (the `.invert` cards) become a light purple appropriate for Day.
- [ ] **T11. Theme-matched app screenshots.** "Inside the app" shows Day screenshots in Day and
  Night screenshots in Night (taken after T10).
- [ ] **T12. Orange pin line instead of the scrollbar.** Hide the browser scrollbar and show a
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
