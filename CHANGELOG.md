# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added (sign-in, branch `feature/password-reset`)

- **Forgot password.** A "Forgot password?" link on the sign-in page opens `/reset`
  (`pages/ResetPassword.jsx`): enter the email and Cognito emails a 6-digit code
  (`ForgotPassword`); enter the code and a new password (same live policy checklist as Register)
  and Cognito sets it (`ConfirmForgotPassword`), then back to sign in. The page never reveals
  whether an account exists (the pool prevents user-existence errors). Demo mode accepts any
  6-digit code. Uses the user pool's existing `verified_email` recovery; no AWS change.

### Tests (sign-in)

- `e2e/live-api.mjs` (44 checks, was 36) now exercises self-service sign-up on the live pool
  (public `SignUp`: password policy, emailed code, duplicate email, unconfirmed account blocked,
  wrong code rejected, sign-in after confirmation) and password reset (`ForgotPassword` sends a
  code, a wrong reset code is rejected). Until now the live test only used admin-created users.
- `e2e/run.mjs` (34 checks, was 32): the full reset flow in demo mode, including that the old
  password stops working.

### Changed (landing round 3, branch `feature/landing-flow`; task list in `LANDING_TASKS.md`)

- **One continuous purple flow.** The landing page sits on a single tall gradient from hero to
  footer, with no slabs and no colour edges: all light by Day, all dark purple by Night. The
  inset dark slabs, the negative light slabs, the plum footer and the nav's dark-over-slab state
  are gone. The capping feature card is lilac by Day and deep purple by Night.
- **Intro orbs:** Day shows a Noto-orange and a dark-purple orb that merge into a lightish purplish
  grey; Night shows a light-orange and a light-purple orb that merge into a greyish purplish
  black. No blend modes: each orb and the exact merge lens carry an aligned copy of the
  statement in the opposite ink, so the words show in negative wherever they pass.
- **Built on AWS:** the lozenge shapes became two faded light orbs (orange and purple) that live
  only inside the four tiles, painted as one picture seen through four windows.
- **In-page links** (nav, footer, buttons) no longer drag through the pinned "How it works"
  section: far jumps fade out, jump, and rise in; near ones glide (`landing/glide.js`).
- **Hero wordmark** drifts away without clipping: the rise-in mask only exists during the rise,
  and the letters and dot fade as they spread.
- **Ambient cursor light:** a very faint purple glow follows the mouse, behind the content.
- **HUD:** roomier glass pills; the section links get a glider that follows the pointer and rests
  on the section in view; Sign in, the Day/Night switch and Create account sit together on the
  right. The top bar shows only the orange ball; after a little scrolling the small wordmark
  draws itself in (the ball rides a vine line, "Noto" rises behind it) (`HudBrand.jsx`).
- **Underglow** on every "Create account" and "Sign in" on the landing page.
- **App:** the accent cards (sign-in card, dashboard "Next up") no longer flip to the opposite
  theme; they are light lilac by Day and deep plum by Night.
- **Inside the app** shows Day or Night screenshots to match the theme (new images in
  `src/assets/landing/*-light.webp` / `*-dark.webp`, made by `e2e/app-screens.mjs`).
- **No browser scrollbar:** a thin orange line with a pin on the right edge tracks the scroll
  position on every page and can be clicked or dragged (`components/ScrollPin.jsx`).

### Tests

- `e2e/landing-motion.mjs`: 32 checks (was 27) covering the orb colours and merge, aligned
  negative copies, the HUD ball/brand drawing, the glider, the underglow, the drift without
  clipping, "Under the hood" never passing through "How it works", the AWS tiles and the scroll
  pin. `e2e/run.mjs` clicks the moved Sign in link. New `e2e/app-screens.mjs`.

### AWS (landing round 3)

- Merged into `main` and deployed to Amplify Hosting with `deploy.ps1 -FrontendOnly`
  (2026-10-10): https://main.dg6fh880g1p8b.amplifyapp.com. Verified live: landing motion 32/32,
  live site 17/17. No backend or template change.

### Changed (landing round 2)

- **Landing page in Noto's purples, with an animated Noto wordmark** (no new dependencies).
  - Yellow is gone from the landing page. The signal is now the purple family (violet `#7b2fff`,
    dark plum `#2d1b4e`, light lilac `#c4b0ff`, a pale mist tint) plus the orange of the Noto dot.
    Buttons have purple circles; the "Free, private, any browser." card, the footer and the dark
    slabs use purple gradients; the timeline line runs lilac to orange with an orange marker dot;
    diagrams are lilac line art with orange dots; the nav capsule's disc carries the orange dot.
  - Hero: a full first screen whose floor is the Noto wordmark (Playfair italic, a plum-to-lilac
    gradient). On arrival the four letters rise out of the floor one by one and the orange dot
    drops in from above the screen, squashes, bounces twice and lands with a ripple, once; its
    glow then breathes. The pointer leans the word and moves a lilac haze behind it; scrolling the
    hero away spreads the letters apart and swells the dot. "sorted." is set in the purple
    gradient. (`components/landing/NotoMark.jsx`)
  - The "Create your account" buttons are gone from the hero and from "Inside the app"; signing
    up is in the nav ("Create account"), the About section and the footer.
  - **Day/Night switch** (sun/moon button in the landing nav, also in the scrolled capsule and the
    phone bar). It sets the site-wide theme (`html[data-theme]`, saved as `scm.theme`, the same
    one the app's sidebar uses) and opens the new theme as a circle from the button (View
    Transitions; instant where unsupported or under reduced motion). The landing page now follows
    that theme instead of always being light. Night is the negative of Day: the landing colours
    are `light-dark()` pairs, so paper and ink swap, the page turns dark and the process slab
    and the footer turn light. The intro slab is shown as an exact negative of its Day self
    (`filter: invert(1) hue-rotate(180deg)`) so the spheres' negative effect still reads. The Noto
    orange and the purple gradient card are identical in both themes. (`ThemeToggle.jsx`,
    `useTheme` now exposes `setTheme` and `isNight`)
  - Intro slab: the two spheres are now grey and light purple, and they sit over the statement
    as negatives (difference blending with neutral greys, plus a lilac glaze on the light one):
    words under them flip dark, and where the spheres merge the centre flips again into a dark
    plum lens. They now merge about a third of the way through the pin, while the words are on
    screen.
  - Reduced motion still turns all of it off; the shared animation loop still stops when idle.

### Added

- `e2e/landing-motion.mjs`: eight more checks (27 in total): the wordmark's dot lands and does not
  replay on hover, scrolling spreads the letters, no "Create your account" button, no Noto yellow,
  the switch turns Day into Night (page, saved choice, intro negative) and back, and the orange is
  the same in both; the reduced-motion check also covers the wordmark.

### AWS

- Frontend deployed to Amplify Hosting with `deploy.ps1 -FrontendOnly` (2026-10-10):
  https://main.dg6fh880g1p8b.amplifyapp.com. Verified live: landing motion 27/27, live website
  17/17. No backend or template change.

### Changed (earlier)

- **Landing page rebuilt** in a "quiet precision" style (reference: Brilean), still in Noto's palette
  and fonts. Replaces the maximalist version below.
  - Off-white page, void ink, a grey ramp mixed from the two; Noto yellow is the only signal colour
    and Noto orange appears only on hover. No gradients or shadows in the UI, native cursor.
  - Archivo at normal width for display (grey line resolving into an ink line), Geist Mono chips
    that stick at 4rem, Playfair for the wordmark and the statement on the black slab.
  - Nav: a wide bar that becomes a centred capsule plus a call-to-action pill after 50px, with a
    light-on-dark state over the black sections (decided by the section actually under the bar).
  - Black intro slab that pulls in from 105% to 95% wide; two Noto-dot orbs meet and part, then
    the statement resolves word by word (scroll-scrubbed, eased).
  - Feature cards that stick, stack 20px apart and shrink as they recede, capped by a volt card.
  - A 400vh "How it works" timeline: steps open as you scroll, the volt line and marker follow the
    active dot (measured with a ResizeObserver, so no lag), looping line diagrams per step.
  - "Built on AWS": frosted cards over two glossy shapes that turn with the pointer.
  - "Inside the app": rows with a pointer-following preview and a native `<dialog>` side panel
    (focus trapped, Escape closes, focus returns). Volt footer with two-phase underline links.
  - One shared requestAnimationFrame loop (`hooks/useScrollFrame.js`) does every scroll-linked
    effect: all layout reads before any writes, and it stops when nothing is moving. No new
    dependencies; reduced motion shows everything in place with nothing pinned.

### Fixed

- Leaving a scrolled page (for example the landing page) opened the next route part-way down. The
  router now scrolls to the top on every route change (`ScrollToTop` in `App.jsx`).
- The previous landing page's lagging headings jumped up to 160px off their place after a fast
  scroll and drifted over the text below; that effect is gone with the rebuild.

### Added

- `e2e/landing-motion.mjs`: 19 motion and interaction checks for the landing page.

### Added (earlier, now replaced)

- **Landing page** for signed-out visitors at `/` (signed-in users still get the dashboard there).
  Noto's palette and three type voices staged in the "playful editorial maximalism" style:
  - Hero: "Because “I forgot” isn’t a study plan." over a magenta/violet highlighter swipe, a giant
    condensed NOTO wordmark (Archivo wdth 62) cropped by the page edge whose letters turn into
    windows onto ruled paper, graph paper, a sticky note and a dot grid on hover, margin notes with
    hand-drawn arrows that draw once, and an opening sequence that waits for the fonts.
  - Four panels that stick and get dealt over each other (scale 0.9, ±0.7°, rounded top corners;
    CSS scroll-driven animations, so browsers without them simply skip it): "Your semester is ___"
    with a rotating roast and a 3D before/after card (a messy downloads folder that flips to Noto);
    "What's inside" with a slow vertical marquee of features whose glass cards blur the text behind
    them (pausable, a still grid below 1200px); "Mind if we show our work?", the AWS services as a
    ghost stack where each one tilts in the screen it powers (CloudWatch shows the backend's real
    log lines); and a footer CTA over a cropped wordmark.
  - Keycap controls, a header that changes colour with the panel beneath it, headings that trail
    the scroll and settle, a trailing orange cursor halo, a back-to-top button, and an easter egg
    (the orange dot gets more annoyed with each click and finally rings a synthesised school bell).
  - Reduced motion turns all of it off; every hover reveal also works on focus and tap.
  - No new dependencies. Lazy-loaded chunk: 22 kB JS + 24 kB CSS (gzip 7.5 + 6.2 kB) plus seven
    WebP screenshots (12–35 kB each) in `src/assets/landing/`.
- Auth pages: the Noto wordmark links back to the landing page.

### Changed

- Playfair Display now loads weights 400–900 (the AWS stack's active name uses 900).
- `e2e/run.mjs` and `e2e/live-site.mjs` check the landing page (32 and 17 checks); `/assignments`
  is now the protected-route check. New screenshot `docs/screenshots/app-00-landing.png`.

### AWS

- **The website is online:** https://main.dg6fh880g1p8b.amplifyapp.com (AWS Amplify Hosting, HTTPS). Stack update on
  2026-10-08 added `WebApp` (`AWS::Amplify::App`) and `WebBranch` (`main`); the API and the files
  bucket now allow that origin in CORS. Nothing was removed.

### Added

- Template: with `EnableCloudFront=false` the site is hosted on Amplify Hosting (SPA rewrite to
  `index.html`, the same security headers as CloudFront). `WebsiteUrl` is always output;
  `AmplifyAppId` is new.
- `deploy.ps1` / `deploy.sh`: upload the build to Amplify as a zip when CloudFront is off
  (`deploy.sh` gained `--no-cloudfront`).
- `e2e/live-site.mjs`: headless-Chrome run against the hosted website with a temporary Cognito
  user (16 checks). `e2e/live-api.mjs` also checks CORS for the hosted origin (36 checks).

### Fixed

- Deploy scripts no longer run `npm ci` when `node_modules` exists; it failed (EPERM) while a dev
  server was running and left `node_modules` half-deleted.

### Changed

- Repository published as the private GitHub repo `vrrroro/Noto`; feature branches merged into `main`.

- **Industrial Noir polish of the Noto design** (palette, subject colours, arches, vine and grain kept):
  - Three type voices: Playfair Display (titles, nav, buttons), Archivo extended (headlines, card
    titles, numbers, body at normal width) and Geist Mono uppercase (labels, tags, spec rows).
    Source Sans 3 removed.
  - Two-tone headlines (claim in full colour, the rest of the sentence muted); mono orange labels;
    5/7 label/headline section headers; spacing tokens (6/12/24/48/96) halved on phones.
  - Squircle trays (`corner-shape: squircle` where supported) with a bevel hairline; glass for the
    phone top bar, the page action bar and toasts; LED glow on the orange dot and primary button.
  - Press physics on controls (hover 1.05/1.02, press 0.97/0.99, 200 ms); spring kept only for the dot.
  - Tokens are `light-dark()` pairs; `.invert` flips one card per page (sign-in card, dashboard
    "Next up") to the opposite theme.
  - Dialogs are side sheets (bottom sheets on phones) with a label, close disc and pinned actions.
  - New: a glass page bar that slides in after scrolling past the header; a black boot loader that
    hides the font swap (max 1.2 s); SVG cursors (orange arrow on clickable things); phone haptics
    (`utils/haptics.js`); staggered card entrances (reduced motion respected).
  - Dashboard: dot-grid stat trays with LED labels; "Next up" card with **Mark complete** for the
    most urgent pending assignment (`summarize().next`, unit-tested); lists in a graphite band.
  - Subjects: giant input bar for adding a subject. Nav, cards and buttons drop decorative icons.
  - e2e screenshots wait for the loader and entrance animations.

- **Rebrand and redesign as "Noto"** (UI only; AWS resource names stay `student-cloud-manager-*`).
  Botanical structure (Playfair Display + Source Sans 3, arches, pill controls, 1px vines, paper
  grain, staggered grids) in the Maximalism palette (`#0D0D1A` void, `#2D1B4E` plum, magenta, cyan,
  yellow, orange, violet). Dark "Night" is the native theme; light "Day" keeps the same accents.
- Signature orange dot (`#FF6B35`, reserved for it): wordmark, nav indicator that springs between
  links, completion toggle knob, dashboard completion meter, end of each page-title vine, loader.
  Motion uses a closed-form spring (CSS `linear()`, about 8% overshoot); reduced motion respected.
- Subjects get one accent each, rotating by creation order (`subjectColors` in `utils/format.js`);
  used for assignment stems, chips, date arches and subject tiles. The dashboard now also loads
  subjects for this.
- Status and priority are shown as a coloured dot beside high-contrast text; file types as arch
  tiles coloured by type.
- Fonts load from Google Fonts (`index.html`); new favicon; e2e waits for the mobile menu animation
  before its screenshot. Screenshots in `docs/screenshots/` regenerated.

### Added

- `e2e/live-api.mjs`: 35-check live test against the deployed stack (Cognito sign-in, every API
  route, real S3 upload/download, validation, cross-user isolation, S3 key tampering). Creates and
  deletes its own temporary users.
- `EnableCloudFront` template parameter and `deploy.ps1 -NoCloudFront`, because new AWS accounts
  cannot create CloudFront resources until AWS verifies them.

### AWS

- **First deployment (2026-10-08)**: stack `student-cloud-manager-dev` in account 956519720747,
  region ap-south-1 (Free plan), with `EnableCloudFront=false`. Created Cognito user pool and client,
  3 DynamoDB tables, files and web S3 buckets, 3 Lambdas with their own IAM roles, the HTTP API with
  its JWT authorizer, 5 log groups, 4 alarms and the dashboard. SAM also created its managed artifact
  bucket stack `aws-sam-cli-managed-default`.
- IAM user `scm-deployer` (AdministratorAccess, CLI access key) was created by hand for deployments.
- The first attempt rolled back (CloudFront account verification) and its empty stack was deleted.

### Changed

- PROJECT_CONTEXT.md: "Resume Here" section (account, credentials, branch, exact commands), the
  architecture as deployed, next steps, and notes on approaches that failed (`aws login`, the
  restricted "Index Zero" account, browser automation on AWS sign-in pages).
- CLAUDE.md: §107 status and §108 next action now reflect the deployed state.
- README.md: `-NoCloudFront` deployment note and the live API test.

---

## [1.0.0] - 2026-10-06

### Added

- **Frontend** (React 19 + Vite): login, register, email verification, dashboard, assignments,
  notes, subjects and 404 pages; sidebar layout with mobile menu; toasts; accessible modal dialogs;
  loading, empty and error states with retry; search, filters and sorting; drag-and-drop upload
  with a progress bar; light, dark and system themes.
- **Auth service**: Cognito via `fetch` (SignUp, ConfirmSignUp, ResendConfirmationCode,
  InitiateAuth with password and refresh flows, RevokeToken), automatic token refresh, and a
  redirect when the session expires.
- **Backend** (Node.js 22 Lambdas): `assignments`, `subjects` and `files` handlers with a shared
  HTTP wrapper, a uniform response envelope, validation, a structured logger, a DynamoDB repository
  and an S3 presigning adapter.
- **File flow**: presigned POST upload, `/files/{id}/complete` confirmation, presigned download,
  delete; TTL clean-up of pending uploads.
- **Demo mode**: runs the real backend route logic in the browser (localStorage + IndexedDB) with
  seeded sample data when AWS is not configured.
- **Infrastructure** (`infrastructure/template.yaml`, AWS SAM): Cognito, HTTP API with JWT
  authorizer, 3 Lambdas, 3 DynamoDB tables, private files bucket, private web bucket + CloudFront
  (OAC), log groups, alarms, dashboard, optional SNS and Budget.
- Deploy and teardown scripts for PowerShell and bash.
- **Tests**: 36 backend unit tests (`node:test`), 17 frontend unit tests (Vitest), a 30-check
  headless-Chrome E2E suite (`e2e/`), and `cfn-lint` validation.
- **Docs**: README, ARCHITECTURE, API, SECURITY, TESTING, PROJECT_CONTEXT, TODO, architecture
  diagram (SVG + PNG), demo script, viva notes, app screenshots.

### Security

- `userId` is taken only from verified JWT claims; every DynamoDB and S3 key is scoped to the owner.
- Per-Lambda least-privilege IAM; private buckets with Block Public Access and TLS-only policies.
- Sanitised client errors; no secrets or tokens in logs; restricted CORS origins.

### Tests performed

- `backend: npm test` → 36/36 pass
- `frontend: npm test` → 17/17 pass; `npm run build` → OK
- `e2e: npm test` → 30/30 checks pass, no console errors
- `cfn-lint infrastructure/template.yaml` → 0 findings

### AWS resources created or modified

- None. The stack is defined but not yet deployed.

---

## [0.1.0] - 2026-10-06

### Added

- Project constitution (`CLAUDE.md`).
