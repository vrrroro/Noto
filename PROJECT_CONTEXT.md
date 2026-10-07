# Project Context

## Resume Here (read first)

Last session: 2026-10-08. The backend is **live on AWS**; the website runs **locally** against it.

| Item | State |
| --- | --- |
| Git | Work is on branch **`feature/aws-deployment`** (3+ commits), **not merged into `main` yet** |
| AWS account | **956519720747** (standalone, Free plan, $100 credit until 2027-04-07), region **ap-south-1** (Mumbai) |
| CLI credentials | `~/.aws/credentials` default profile = IAM user `scm-deployer` in that account. Check with `aws sts get-caller-identity` |
| Tools | AWS CLI 2.37 (`C:\Program Files\Amazon\AWSCLIV2`), SAM CLI 1.167 (`C:\Program Files\Amazon\AWSSAMCLI\bin`), Node 24. Both are on PATH in new terminals; add those folders if a shell says `aws` is not found |
| Frontend config | `frontend/.env.local` (git-ignored) already points at the live stack |
| CloudFront | **Off** (`EnableCloudFront=false`); blocked until AWS verifies the account |

Start the app:

```powershell
cd C:\Users\rohit\Downloads\AWS\frontend
npm run dev          # http://localhost:5173 (live AWS mode: no "Demo mode" banner)
```

Re-check that AWS works (creates and deletes its own test users, about 30 s):

```powershell
cd C:\Users\rohit\Downloads\AWS
node e2e/live-api.mjs   # expect 35/35
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

**Deployed to AWS (backend) on 2026-10-08. Live API verified. CloudFront hosting pending AWS account
verification; the frontend runs locally against the live backend.**

## Current Status

Backend stack `student-cloud-manager-dev` is `CREATE_COMPLETE` in account **956519720747**,
region **ap-south-1**, deployed with `EnableCloudFront=false`. `frontend/.env.local` (git-ignored)
points the app at it. The account is on the AWS **Free plan** ($100 credit, expires 2027-04-07).

## Working Features (verified)

Verified live against AWS by `node e2e/live-api.mjs` (35/35, 2026-10-08):

- Cognito sign-in with real tokens; wrong password rejected
- JWT authorizer: no token / garbage token → 401; CORS preflight for `http://localhost:5173`
- Subjects, assignments (CRUD, complete, validation) in DynamoDB
- Files: presigned POST to S3, complete, list, byte-identical download, delete, type/size limits
- Cross-user isolation (404 for B on A's assignment and file; S3 rejects a tampered key)

Also verified locally earlier: full UI in demo mode (30-check E2E), 36 backend + 17 frontend unit tests.

## Implemented but NOT yet verified against AWS

- Sign-up and the Cognito verification email through the UI (needs a real inbox)
- The UI's manual checklist in TESTING.md against the live backend
- CloudFront hosting (blocked: account verification), CloudWatch alarm emails and the Budget
  (no `AlertEmail` given yet)

## In Progress

Nothing running. Waiting on the developer's manual UI test and the decisions listed in Next Task.

## Known Issues

- New AWS accounts cannot create CloudFront resources until verified ("Your account must be verified
  before you can add new CloudFront resources"). Open an AWS Support case (Account and billing,
  free) quoting that message, then redeploy without `-NoCloudFront`.
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
| Lambda | `student-cloud-manager-{assignments,subjects,files}-dev`, each with its own IAM role |
| CloudWatch | log groups (14 days), 4 alarms, dashboard `student-cloud-manager-dev` |
| IAM user | `scm-deployer` (AdministratorAccess, CLI key, created by hand; delete or restrict after the demo) |
| Not created | CloudFront distribution, SNS topic, Budget |

## Current Architecture

**Deployed now:** Browser (local Vite dev server, http://localhost:5173) → Cognito (auth).
Browser → API Gateway HTTP API (JWT) → 3 Lambdas → DynamoDB (3 tables) / S3 presign.
Browser ↔ S3 files bucket via presigned URLs.

**Target (after CloudFront verification):** the same, with the website served by
CloudFront → private S3 web bucket (OAC). See ARCHITECTURE.md.

## Important Decisions

- **UI name is "Noto"** (2026-10-08). Repository, AWS stack and resource names stay
  `student-cloud-manager-*` (renaming them would recreate the stack). localStorage keys stay `scm.*`.
- **Design system** (frontend/src/styles/global.css, tokens at the top): Botanical structure in the
  Maximalism palette; orange `#FF6B35` is reserved for the Noto dot; spring easing via CSS
  `linear()`. Plain CSS, no UI or icon library. Fonts from Google Fonts.

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

## Next Task (exact)

1. **Merge** `feature/aws-deployment` into `main` once the developer is happy
   (`git switch main; git merge feature/aws-deployment`).
2. **Developer UI test:** `npm run dev`, register with a real email at http://localhost:5173, enter
   the emailed code, then run TESTING.md's manual checklist. Record results in TESTING.md.
3. **Alert email (still undecided):** ask which address gets alarm and budget emails, then
   `.\infrastructure\scripts\deploy.ps1 -NoCloudFront -AlertEmail <email>` and have the developer
   click the SNS confirmation link.
4. **CloudFront:** the developer opens an AWS Support case (Account and billing, free) quoting the
   CloudFront verification error. After approval run
   `.\infrastructure\scripts\deploy.ps1 -AlertEmail <email>` (no `-NoCloudFront`), then test on
   the printed CloudFront URL.
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

## Last Updated

2026-10-08
