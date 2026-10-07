# Project Context

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

Manual UI test by the developer at http://localhost:5173 (`cd frontend && npm run dev`).

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

Browser → CloudFront → S3 (web). Browser → Cognito (auth). Browser → API Gateway HTTP API
(JWT) → 3 Lambdas → DynamoDB (3 tables) / S3 presign. Browser ↔ S3 files bucket via presigned URLs.
See ARCHITECTURE.md.

## Important Decisions

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

Superseded steps from before the deployment are kept below for reference. Current next steps:

1. Developer: register with a real email at http://localhost:5173 and run TESTING.md's manual checklist.
2. Open an AWS Support case to verify the account for CloudFront; then
   `.\infrastructure\scripts\deploy.ps1 -AlertEmail <email>` (CloudFront on, alarms + budget).
3. Capture the AWS Console screenshots in `docs/presentation/DEMO_SCRIPT.md`.
4. After the demo: delete the `scm-deployer` access key (or the user).

Previous plan:

1. Install AWS CLI v2 + SAM CLI, then run `aws configure` (IAM user/SSO, not root; MFA on).
2. Check current pricing and free-tier status for the services.
3. `.\infrastructure\scripts\deploy.ps1 -AlertEmail <your email>` and confirm the SNS email.
4. Work through the **manual checklist in TESTING.md** on the CloudFront URL; record results.
5. Capture the AWS Console screenshots listed in `docs/presentation/DEMO_SCRIPT.md`.
6. Update this file, CHANGELOG.md and TODO.md with the verified state.

## Last Updated

2026-10-08
