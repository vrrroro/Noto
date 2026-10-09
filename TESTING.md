# Testing

| Suite | Tool | Command | Last result (2026-10-06) |
| --- | --- | --- | --- |
| Backend unit | `node:test` (built in, no dependency) | `cd backend && npm test` | **36 / 36 pass** |
| Frontend unit | Vitest | `cd frontend && npm test` | **19 / 19 pass** (2026-10-08) |
| Production build | Vite | `cd frontend && npm run build` | builds cleanly |
| End-to-end (browser) | Headless Chrome via `puppeteer-core` against `npm run dev` (demo mode) | `cd e2e && npm test` | **32 / 32 checks pass** (2026-10-08), no console errors |
| Infrastructure | `cfn-lint` 1.57 (includes the SAM transform) | `cfn-lint infrastructure/template.yaml` | **0 findings** |
| Live AWS API | `node` + AWS CLI against the deployed stack | `node e2e/live-api.mjs` | **36 / 36 pass** (2026-10-08) |
| Landing motion | Headless Chrome via `puppeteer-core` (one-time wordmark drop, drift without clipping, no yellow, Day/Night and orb colours, HUD ball and brand, glider, underglow, aligned orb copies, in-page jumps, AWS tiles, scroll pin, card stack, timeline, dialog, idle loop, reduced motion) | `node e2e/landing-motion.mjs` (dev server running) | **32 / 32 pass** (2026-10-10, local and live) |
| Live website | Headless Chrome via `puppeteer-core` against the hosted `WebsiteUrl`, temporary Cognito user | `node e2e/live-site.mjs` | **17 / 17 pass** (2026-10-08), no console errors |
| Live AWS UI (manual) | manual checklist below | open the website | sign-up with a real email pending |

## Backend unit tests (`backend/test`)

- **validation.test.js**: real-date checks (`2026-02-30` and `banana` rejected), title, description
  and subject limits, priority enum, partial updates, file-name sanitising (`../../etc/passwd.txt`
  → `passwd.txt`), allowed types, the 10 MB limit.
- **assignments.test.js**: create (a `userId` in the body is ignored), canonical subject names,
  per-user sorted list, get/update/complete/delete, **user B cannot read, update or delete user A's
  assignment**, error envelope format, invalid JSON, unauthenticated `401`, unknown route, internal
  errors hidden, base64 bodies.
- **subjects.test.js**: create/list, case-insensitive duplicates `409`, empty names, delete blocked
  while in use `409`, cross-user delete `404`.
- **files.test.js**: presigned POST scoped to `users/{userId}/…`, pending uploads hidden and given a
  TTL, confirm-before-upload `409`, confirmed upload listed with its real size, unsupported, oversized
  and unknown-subject rejections, download link only for uploaded files, **cross-user list,
  download, confirm and delete blocked**, delete removes object and metadata, oversized object
  removed on confirm.
- **aws.test.js**: the real AWS adapters, run offline. DynamoDB `Query` pagination, composite keys,
  `SET`/`REMOVE` update expressions, conditional-failure mapping; S3 presigned POST policy (key,
  content type, `content-length-range`), presigned GET expiry and `Content-Disposition`.

## Frontend unit tests

- **utils.test.js**: local-date parsing (no UTC shift), relative due labels, byte formatting, file
  pre-checks using the backend's limits, filter/search/sort, password rules, dashboard maths.
- **demoBackend.test.js**: the demo backend runs the real Lambda handlers. It covers seeding, user
  isolation, `401` without a token, path-parameter routing, validation errors and persistence.

## End-to-end run (demo mode)

Script: [`e2e/run.mjs`](e2e/run.mjs) uses `puppeteer-core` with your locally installed Chrome or
Edge, so no browser download is needed. It drives the real UI and also refreshes the screenshots in
`docs/screenshots/`.

```bash
cd frontend && npm run dev          # terminal 1
cd e2e && npm install && npm test   # terminal 2 (set CHROME_PATH if Chrome is not auto-detected)
```

| # | Check | Result |
| --- | --- | --- |
| 0a–0b | Signed-out visitor sees the landing page; it links to sign-up and sign-in | ✅ |
| 1 | Unauthenticated user redirected to login (from `/assignments`) | ✅ |
| 2–3 | Register rejects mismatched / weak passwords | ✅ |
| 4–5 | Register + verify works; duplicate email rejected | ✅ |
| 6 | Wrong password rejected | ✅ |
| 7–8 | Login lands on dashboard; stats `6 / 5 / 1 / 1` computed from data | ✅ |
| 9–12 | Assignment form validation; create; mark complete; edit | ✅ |
| 13–14 | Search and status filter | ✅ |
| 15–16 | Delete assignment; data persists after refresh | ✅ |
| 17–18 | Oversized (11 MB) and unsupported (`.exe`) files rejected | ✅ |
| 19–21 | Upload PDF; download (bytes identical to upload); delete | ✅ |
| 22–25 | Create subject; duplicate rejected; in-use subject cannot be deleted; delete unused | ✅ |
| 26 | No horizontal scrolling at 390 px mobile width | ✅ |
| 27 | Logout + protected route redirects to login | ✅ |
| 28–29 | Second user cannot see user A's data; direct read/delete of A's assignment returns `404` | ✅ |
| 30 | No browser console errors during the whole run | ✅ |

## Manual checklist for the live AWS deployment

Run after `infrastructure/scripts/deploy.ps1`, using the website URL (https://main.dg6fh880g1p8b.amplifyapp.com on
Amplify, or the CloudFront URL once enabled). Record the results here.

### Authentication
- [ ] Register with a real email; verification code arrives
- [ ] Login
- [ ] Logout (then the browser Back button does not show private pages)
- [ ] Wrong password shows "Incorrect email or password."
- [ ] Invalid email rejected
- [ ] Opening `/assignments` while logged out redirects to login
- [ ] `curl $API_URL/assignments` without a token returns `401`

### Assignments
- [ ] Create, then the item appears in the DynamoDB console (`…-assignments-dev`, partition = your `sub`)
- [ ] View after refresh
- [ ] Edit
- [ ] Complete / mark pending
- [ ] Delete
- [ ] Invalid data (empty title) shows an error

### Files
- [ ] Upload PDF, then the object exists in S3 under `users/<sub>/files/…` and the metadata is `UPLOADED`
- [ ] Upload image
- [ ] Download (the file opens correctly)
- [ ] Delete, then the object is gone from S3
- [ ] Oversized file rejected
- [ ] Unsupported file rejected

### Security
- [ ] User A cannot see User B's assignments (two browsers / private window)
- [ ] User A cannot delete User B's assignment: `curl -X DELETE` with A's token and B's ID returns `404`
- [ ] User A cannot download User B's file: same with `/files/{id}/download`
- [ ] Opening an S3 object URL directly (without a signature) returns `AccessDenied`

### Monitoring
- [ ] CloudWatch → Log groups → `/aws/lambda/student-cloud-manager-*-dev` shows `Request completed` lines
- [ ] Dashboard `student-cloud-manager-dev` shows invocations
- [ ] Budget created (if `-AlertEmail` was given) and the SNS subscription confirmed
