# Project Context

## Resume Here (read first)

Last session: 2026-10-11. **Round 6** (12 owner changes, see `LANDING_TASKS.md`) finished rounds 4–6: all three are merged into `main` and deployed (backend stack and Amplify). Verified locally: landing motion 42/42, demo E2E 40/40, backend 37/37, frontend unit 21/21; verified live on https://main.dg6fh880g1p8b.amplifyapp.com: live API 46/46, live site 17/17, landing motion 42/42. Before that, **Round 5** (19 owner changes across the landing page and the app: grey intro only on the wordmark, even section spacing, steps under titles, row hover cards, AWS tint inside tiles, swapped Night orbs, Noto in the logo face, Home button and signed-in landing menu, `/` opens the dashboard when signed in, Day/Night only with the circle switch, real names from sign-up, subject colours, softer glows, one-screen sign-in, contained meter) is on branch **`feature/landing-round5`** (from round 4), pushed, **not merged and not deployed**; checklist and notes in `LANDING_TASKS.md` (Round 5). Verified locally: landing motion 41/41, demo E2E 38/38, backend 37/37, frontend unit 20/20. The subject-colour backend change needs a Lambda deploy before colours sync across devices (ask first). Landing round 4 (grey first-load intro with a falling dot and a colour ripple, evenly spaced "How it works", no top-left ball, no hover on "Inside the app", copy without "student"/"project", "Back to home" on sign-in pages) is on branch **`feature/landing-round4`**, pushed to GitHub, **not merged and not deployed**: the owner reviews it locally first (`npm run dev`) and will ask for more changes. Verified locally: landing motion 38/38, demo E2E 34/34, frontend unit 19/19. Before that, 2026-10-10: "Forgot password" (`/reset`) added, merged into `main` and deployed; self-service sign-up and reset verified on the live pool (live API 44/44). Landing round 3 (continuous purple flow, new orbs, HUD, scroll pin, theme-matched screenshots; see `LANDING_TASKS.md`) is merged into `main`, pushed and **deployed to Amplify**; verified live (landing motion 32/32, live site 17/17). **Noto is online:** https://main.dg6fh880g1p8b.amplifyapp.com (AWS Amplify Hosting, HTTPS) against the live
AWS backend.

| Item | State |
| --- | --- |
| Git | **`main`** is current (feature branches merged 2026-10-08). Remote: private GitHub repo **https://github.com/vrrroro/Noto** (`origin`) |
| AWS account | **956519720747** (standalone, Free plan, $100 credit until 2027-04-07), region **ap-south-1** (Mumbai) |
| CLI credentials | `~/.aws/credentials` default profile = IAM user `scm-deployer` in that account. Check with `aws sts get-caller-identity` |
| Tools | AWS CLI 2.37 (`C:\Program Files\Amazon\AWSCLIV2`), SAM CLI 1.167 (`C:\Program Files\Amazon\AWSSAMCLI\bin`), Node 24. Both are on PATH in new terminals; add those folders if a shell says `aws` is not found |
| Frontend config | `frontend/.env.local` (git-ignored) already points at the live stack |
| Website | **https://main.dg6fh880g1p8b.amplifyapp.com** on AWS Amplify Hosting (app `dg6fh880g1p8b`, branch `main`, manual zip deploys) |
| CloudFront | **Off** (`EnableCloudFront=false`); blocked until AWS verifies the account. While off, the template hosts the site on Amplify |

Open the app: **https://main.dg6fh880g1p8b.amplifyapp.com**. For local development against the same backend:

```powershell
cd C:\Users\rohit\Downloads\AWS\frontend
npm run dev          # http://localhost:5173 (live AWS mode: no "Demo mode" banner)
```

Re-check that AWS works (each creates and deletes its own test user(s)):

```powershell
cd C:\Users\rohit\Downloads\AWS
node e2e/live-api.mjs    # the API, expect 44/44 (about 30 s)
node e2e/live-site.mjs   # the hosted website in headless Chrome, expect 17/17 (about 40 s)
E2E_BASE_URL=https://main.dg6fh880g1p8b.amplifyapp.com node e2e/landing-motion.mjs   # landing motion, 32/32
```

Publish frontend changes to the website (builds, uploads the zip to Amplify, waits for it):

```powershell
.\infrastructure\scripts\deploy.ps1 -FrontendOnly
```

Redeploy after backend/template changes. **Keep `-NoCloudFront` until the account is verified**,
otherwise the update fails on CloudFront and rolls back:

```powershell
.\infrastructure\scripts\deploy.ps1 -NoCloudFront
```

SAM shows the change set and asks for confirmation (`confirm_changeset = true` in samconfig.toml).
Review it before answering `y`.

## What are we building?

Student Cloud Manager: a serverless AWS web app where students manage assignments (deadlines,
priority, completion), subjects, and uploaded notes/files. It is an academic project, so it must be
simple, secure, demonstrable and cheap.

## Current Phase

**Fully deployed to AWS on 2026-10-08.** The backend is live and verified; the website is on AWS
Amplify Hosting and verified in a browser. CloudFront hosting waits for AWS account verification.

## Current Status

Backend stack `student-cloud-manager-dev` is `UPDATE_COMPLETE` in account **956519720747**,
region **ap-south-1**, deployed with `EnableCloudFront=false`, which also creates the Amplify
Hosting app for the website. `frontend/.env.local` (git-ignored)
points the app at it. The account is on the AWS **Free plan** ($100 credit, expires 2027-04-07).

## Working Features (verified)

Verified live against AWS by `node e2e/live-api.mjs` (44/44, 2026-10-10):

- Cognito sign-in with real tokens; wrong password rejected
- Self-service sign-up (public SignUp API: password policy, emailed code, duplicate email,
  unconfirmed account blocked, wrong code rejected) and password reset (ForgotPassword sends a
  code to the verified email, a wrong reset code is rejected)
- JWT authorizer: no token / garbage token → 401; CORS preflight for `http://localhost:5173` and
  for the hosted website
- Subjects, assignments (CRUD, complete, validation) in DynamoDB
- Files: presigned POST to S3, complete, list, byte-identical download, delete, type/size limits
- Cross-user isolation (404 for B on A's assignment and file; S3 rejects a tampered key)

Verified on the hosted website by `node e2e/live-site.mjs` (17/17, 2026-10-08): HTTPS deep links,
the landing page, sign-in redirect, live mode, wrong password, sign-in, subject, assignment create/complete/refresh,
S3 upload, byte-identical download, deletes, sign-out, no console errors.

Also verified locally: full UI in demo mode (34-check E2E, including the landing page and password reset),
36 backend + 19 frontend unit tests.

## Implemented but NOT yet verified against AWS

- That the verification and reset emails actually arrive in a real inbox (the APIs that send them
  are verified live; delivery needs the owner's own email)
- The UI's manual checklist in TESTING.md against the live backend
- CloudFront hosting (blocked: account verification; Amplify serves the site meanwhile),
  CloudWatch alarm emails and the Budget
  (no `AlertEmail` given yet)

## In Progress

Nothing running. Waiting on the developer's manual UI test and the decisions listed in Next Task.

## Known Issues

- New AWS accounts cannot create CloudFront resources until verified ("Your account must be verified
  before you can add new CloudFront resources"). Open an AWS Support case (Account and billing,
  free) quoting that message, then redeploy without `-NoCloudFront`. Until then the website is on
  Amplify Hosting, which needs no verification.
- The first AWS account tried ("Index Zero", 314113910114) is an organization member whose
  service control policies deny Lambda, DynamoDB, S3, Cognito, CloudFormation, etc. It is not used.

## AWS Resources

Account 956519720747, ap-south-1:

| Type | Name / ID |
| --- | --- |
| CloudFormation stacks | `student-cloud-manager-dev`, `aws-sam-cli-managed-default` (SAM artifacts bucket) |
| Cognito user pool / client | `ap-south-1_q2jzZYxX0` / `2ehumlq16o3kg94a3s0t23abqe` |
| API (HTTP API) | `https://ym5l95nrc4.execute-api.ap-south-1.amazonaws.com` |
| DynamoDB | `student-cloud-manager-{assignments,subjects,files}-dev` |
| S3 | `student-cloud-manager-files-dev-956519720747`, `student-cloud-manager-web-dev-956519720747` (empty until CloudFront) |
| Amplify Hosting | app `student-cloud-manager-web-dev` (`dg6fh880g1p8b`), branch `main` → https://main.dg6fh880g1p8b.amplifyapp.com |
| Lambda | `student-cloud-manager-{assignments,subjects,files}-dev`, each with its own IAM role |
| CloudWatch | log groups (14 days), 4 alarms, dashboard `student-cloud-manager-dev` |
| IAM user | `scm-deployer` (AdministratorAccess, CLI key, created by hand; delete or restrict after the demo) |
| Not created | CloudFront distribution, SNS topic, Budget |

## Current Architecture

**Deployed now:** Browser → AWS Amplify Hosting (HTTPS, the React build; SPA rewrite to
index.html; security headers). Browser → Cognito (auth).
Browser → API Gateway HTTP API (JWT) → 3 Lambdas → DynamoDB (3 tables) / S3 presign.
Browser ↔ S3 files bucket via presigned URLs.

**Target (after CloudFront verification):** the same, with the website served by
CloudFront → private S3 web bucket (OAC) instead of Amplify. Redeploying without `-NoCloudFront`
creates CloudFront and removes the Amplify app. See ARCHITECTURE.md.

## Important Decisions

- **UI name is "Noto"** (2026-10-08). Repository, AWS stack and resource names stay
  `student-cloud-manager-*` (renaming them would recreate the stack). localStorage keys stay `scm.*`.
- **Design system** (frontend/src/styles/global.css, tokens at the top): Maximalism palette with
  Botanical identity (arches, vine, grain, subject colours), polished in the Industrial Noir style:
  Playfair / Archivo extended / Geist Mono, two-tone headlines, squircle trays with bevel hairlines,
  glass chrome, LED glow. Orange `#FF6B35` is the signal (dot, primary action, active state,
  labels, focus); subjects never use it. Role tokens are `light-dark()` pairs and `.invert` flips one
  card per page. The spring easing is only used for the dot. Plain CSS, no UI or icon library.
  Fonts from Google Fonts.

- **Landing page** (2026-10-08, reworked 2026-10-10 in three rounds; the last one is tracked in
  `LANDING_TASKS.md`): signed-out visitors to `/` see `pages/Landing.jsx` (lazy chunk; sections in
  `components/landing/`, copy in `components/landing/content.js`, styles in
  `styles/landing.css`). Owner's calls: **no yellow**; the signal is Noto's purples (`--l-purple`,
  `--l-plum`, `--l-lilac`, mode-aware `--l-accent`) plus the Noto-dot orange `#ff6b35`, identical
  in both themes. **Day is all light, Night is all dark purple, never a mix**: the whole page sits
  on one continuous gradient (`--l-flow`), with no slabs or section edges. The hero floor is the
  animated wordmark (`NotoMark.jsx`; the dot drops once, the letters drift and fade on scroll
  with no clipping). The top bar shows only the orange ball; the HUD (glass pills, glider, actions
  group) draws the small wordmark in after 160px (`HudBrand.jsx`). Intro orbs: Day orange + dark
  purple merging to a light purplish grey, Night light orange + light purple merging to a
  greyish purplish black, with aligned negative copies of the statement inside each orb and the
  merge lens (no blend modes). AWS glows live only inside the tiles. In-page links jump past the
  pinned section (`glide.js`). A faint purple light follows the cursor (`CursorGlow.jsx`).
  "Create account" / "Sign in" have an underglow; no "Create your account" buttons. The
  Day/Night switch (`ThemeToggle.jsx`) sets the site-wide `scm.theme`. "Inside the app" shows
  theme-matched screenshots (regenerate with `e2e/app-screens.mjs`). The browser scrollbar is
  replaced site-wide by an orange pin line (`components/ScrollPin.jsx`). All
  scroll-linked motion runs through one rAF loop in `hooks/useScrollFrame.js` (read phase, then
  write phase; stops when idle). No GSAP or Lenis: sticky positioning plus eased scrubs.
  Everything is off under reduced motion. Copy must stay true to what the app does.
  `node e2e/landing-motion.mjs` (38 checks) guards the motion and the theme switch.
- React 19 + Vite frontend; React Router; no UI library; no auth SDK (Cognito called with `fetch`)
- Backend: Node.js 22 Lambdas (ES modules), AWS SDK v3; route logic is pure JS with injected deps
- 3 Lambdas (one per resource) with per-function least-privilege IAM
- HTTP API (v2) with a Cognito JWT authorizer; `userId` taken only from `claims.sub`
- DynamoDB: 3 tables, PK `userId`, SK item ID, on-demand; files table TTL for pending uploads
- Files: presigned POST (S3 enforces type and size) → `/files/{id}/complete` confirmation
- Demo mode: the frontend runs the real backend route logic with localStorage/IndexedDB when AWS
  env vars are absent
- **Infrastructure as code (SAM) was introduced now**, a deliberate deviation from CLAUDE.md §37
  ("not until the architecture is understood"). With no console access, a reviewed template is the
  safest, most reproducible and most easily deleted way to create the stack, and the template is
  heavily commented for learning.
- Cognito Lite tier; CloudFront PriceClass_100; log retention 14 days; API throttling 10 rps / burst 20
- **Website on AWS Amplify Hosting while CloudFront is blocked** (2026-10-08, approved by the
  developer). `EnableCloudFront=false` now means "host on Amplify" (HTTPS, managed CDN, no account
  verification) instead of "no website". Manual zip deploys with no Git connection, so no build
  minutes. Cost: cents per month, paid from the credit. It stays in the template as the fallback.

## Next Task (exact)

1. ~~Merge the feature branches into `main`~~ Done 2026-10-08; pushed to the private repo
   https://github.com/vrrroro/Noto. New work: branch from `main`, push, merge back.
2. **Developer UI test:** register with a real email at https://main.dg6fh880g1p8b.amplifyapp.com, enter
   the emailed code, then run TESTING.md's manual checklist. Record results in TESTING.md.
3. **Alert email (still undecided):** ask which address gets alarm and budget emails, then
   `.\infrastructure\scripts\deploy.ps1 -NoCloudFront -AlertEmail <email>` and have the developer
   click the SNS confirmation link.
4. **CloudFront:** the developer opens an AWS Support case (Account and billing, free) quoting the
   CloudFront verification error. After approval run
   `.\infrastructure\scripts\deploy.ps1 -AlertEmail <email>` (no `-NoCloudFront`), then test on
   the printed CloudFront URL (`node e2e/live-site.mjs`). That update removes the Amplify app, so
   the amplifyapp.com URL stops working.
5. Capture the AWS Console screenshots in `docs/presentation/DEMO_SCRIPT.md`.
6. **After the demo:** delete the `scm-deployer` access key (IAM → Users → scm-deployer → Security
   credentials), or the whole user. Decide whether to keep the stack or run `destroy.ps1`.

## Session Notes (2026-10-08): approaches that failed, do not retry

- **`aws login`** (CLI sign-in through the browser console session) fails for this developer with
  "Something went wrong" on AWS's page. Use the IAM access key instead.
- **Browser automation on AWS sign-in pages** triggers AWS's automated-activity block, and the
  Chrome extension has no permission for `console.aws.amazon.com`. Console steps (sign-in, creating
  users or keys, support cases) must be done by the developer, guided one step at a time.
- **Account "Index Zero" (314113910114)** is an organization member account. Its management account
  (045058550507) applies SCPs that deny nearly every service. Its `scm-deployer` key is now invalid,
  and the developer's console login (rohitsham50) lands there by default. Do not use it.
- The first deploy rolled back on CloudFront; the empty `ROLLBACK_COMPLETE` stack was deleted.
- The developer is new to AWS: give one concrete step at a time, with exact button names.
- `deploy.ps1` used to run `npm ci`, which fails with EPERM while a Vite dev server holds
  `node_modules` (rolldown binding) and leaves the folder half-deleted. It now runs `npm ci` only
  when `node_modules` is missing. Stop the dev server first if you need a clean install.

## Last Updated

2026-10-10
