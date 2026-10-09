# Handoff: Noto (Student Cloud Manager)

A one-page brief for any agent or person picking this project up. Last updated 2026-10-08.
For detail, read `PROJECT_CONTEXT.md` next, then `CLAUDE.md` (the project rules).

## What it is

- Noto is a web app where students manage assignments, subjects and uploaded notes.
- It is a college AWS cloud-computing project, so it must stay simple, secure, cheap and easy to explain.
- The UI is called "Noto"; the repo, AWS stack and resource names stay `student-cloud-manager-*`.
- The owner is Rohit (GitHub `vrrroro`), who is new to AWS.

## Where things are

- Live website: https://main.dg6fh880g1p8b.amplifyapp.com
- Code: private repo https://github.com/vrrroro/Noto, branch `main`, local copy at `C:\Users\rohit\Downloads\AWS`.
- AWS account `956519720747`, region `ap-south-1` (Mumbai), Free plan with $100 credit until 2027-04-07.
- CLI login: the `default` profile in `~/.aws/credentials` is IAM user `scm-deployer`. Check it with `aws sts get-caller-identity`.

## Status

- Every MVP feature is built and deployed: register, log in, log out, assignments, subjects, file upload and download, dashboard.
- The backend and the website are verified live by automated tests.
- Optional extras are done too: search, filters, sorting, dark mode, upload progress, a public landing page.
- Still open: sign-up with a real email through the UI, the alert email, CloudFront, console screenshots.
- Landing page round 3 (one continuous purple flow, new orbs, glass HUD, orange scroll pin, theme-matched screenshots) is merged into `main` and deployed (2026-10-10, verified live); every task and its notes are in `LANDING_TASKS.md`.

## Architecture

- Browser → AWS Amplify Hosting serves the React build over HTTPS.
- Browser → Cognito handles sign-up and sign-in; no passwords are stored by the app.
- Browser → API Gateway HTTP API (JWT authorizer) → 3 Lambdas (assignments, subjects, files).
- Lambdas → 3 DynamoDB tables (key: `userId` + item id) and S3 presigned URLs.
- Files go straight from the browser to S3 with presigned POST; S3 enforces type and the 10 MB limit.
- The backend takes `userId` only from the token (`claims.sub`), so one user can never reach another's data.
- CloudWatch has log groups (14 days), 4 alarms and a dashboard.
- Everything is defined in one SAM template: `infrastructure/template.yaml`.

## Code map

- `frontend/`: React 19 + Vite + React Router, plain CSS, no UI library, Cognito called with plain `fetch`.
- `frontend/src/pages/`: Landing, Login, Register, ConfirmAccount, Dashboard, Assignments, Notes, Subjects, NotFound.
- `frontend/src/components/landing/`: the landing page sections; its copy lives in `content.js`.
- `frontend/src/styles/global.css`: app design tokens. `landing.css`: landing page only.
- `frontend/src/hooks/useScrollFrame.js`: the single animation loop for all landing page motion.
- `frontend/src/services/demo/`: demo mode, which runs the real backend logic in the browser with no AWS.
- `backend/src/apps/`: route logic as pure functions. `lambdas/`: the 3 handlers. `aws/`: DynamoDB and S3 adapters.
- `e2e/`: browser and live tests (puppeteer-core, uses the installed Chrome or Edge).
- `infrastructure/scripts/`: `deploy.ps1`/`.sh` and `destroy.ps1`/`.sh`.
- Docs: `README.md`, `ARCHITECTURE.md`, `API.md`, `SECURITY.md`, `TESTING.md`, `CHANGELOG.md`, `TODO.md`, `docs/presentation/`.

## Run it

- `cd frontend` then `npm run dev` opens http://localhost:5173 against the live AWS backend.
- `frontend/.env.local` (git-ignored) holds the AWS settings; `.env.example` lists the four `VITE_*` keys.
- With the `VITE_*` values empty the app runs in demo mode: everything works offline in the browser.

## Test it

- Backend unit: `cd backend && npm test` (36/36).
- Frontend unit: `cd frontend && npm test` (19/19).
- Demo end-to-end: `cd e2e && npm test` (34/34). It needs a dev server in demo mode; set `E2E_BASE_URL` if that server is not on 5173.
- Landing motion: `node e2e/landing-motion.mjs` with a dev server running (32/32).
- Live API: `node e2e/live-api.mjs` (44/44). Live website: `node e2e/live-site.mjs` (17/17).
- The live tests create and delete their own temporary Cognito users.
- Run the landing motion test against production with `E2E_BASE_URL=https://main.dg6fh880g1p8b.amplifyapp.com`.

## Deploy it

- Frontend only: `.\infrastructure\scripts\deploy.ps1 -FrontendOnly` (build, zip, upload to Amplify, wait).
- Backend or template changes: `.\infrastructure\scripts\deploy.ps1 -NoCloudFront`.
- Always keep `-NoCloudFront` until AWS verifies the account; otherwise the deploy fails and rolls back.
- SAM shows a change set and asks `y/n`; review it before confirming.
- Stop the dev server before a clean `npm ci`, or it fails with EPERM.

## Next steps, in order

1. The owner registers with a real email on the live site and runs the manual checklist in `TESTING.md`.
2. Ask which email gets alarm and budget alerts, then deploy with `-NoCloudFront -AlertEmail <email>`.
3. The owner opens a free AWS Support case to unlock CloudFront, then deploys without `-NoCloudFront`. This removes the Amplify app and its URL.
4. Capture the AWS Console screenshots listed in `docs/presentation/DEMO_SCRIPT.md`.
5. After the demo, delete the `scm-deployer` access key (it has AdministratorAccess) and decide whether to run `destroy.ps1`.

## Rules to follow

- Never add `Co-Authored-By: Claude` or "Generated with Claude Code" to commits or PRs.
- Ask before deleting or changing AWS resources, or making big architecture changes (`CLAUDE.md` §104).
- Never put AWS keys, passwords or tokens in chat, code, commits or logs.
- Do not automate AWS sign-in pages in a browser; AWS blocks it. The owner does console steps, one step at a time with exact button names.
- Avoid new dependencies; the landing page deliberately uses no GSAP or Lenis.
- Keep Noto's colours and fonts (Playfair, Archivo, Geist Mono). The landing page uses no yellow: purples plus the orange dot.
- Work on a `feature/*` branch, test, update `CHANGELOG.md`, `PROJECT_CONTEXT.md` and `TODO.md`, then merge to `main` and push.
- Say "implemented" versus "verified" honestly; only call something verified after a test ran.

## Do not retry

- `aws login` through the browser fails for this owner; use the access key.
- Account "Index Zero" (`314113910114`) blocks almost every service by policy; do not use it.
- Creating CloudFront fails until the account is verified.
