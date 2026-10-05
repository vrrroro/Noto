# Project Context

## What are we building?

Student Cloud Manager: a serverless AWS web app where students manage assignments (deadlines,
priority, completion), subjects, and uploaded notes/files. It is an academic project, so it must be
simple, secure, demonstrable and cheap.

## Current Phase

**Phases 0–6 and 8–10 implemented and verified locally. Phase 7 (monitoring) is defined in IaC.
Deployment to AWS (live verification of phases 2–7) is pending.**

## Current Status

MVP feature-complete. All P0 features work in the browser in demo mode, and all automated suites
pass. The AWS stack is written (SAM) and lint-clean but **has not been deployed**, because no AWS
account or CLI was available when it was built.

## Working Features (verified)

Verified by unit tests and the headless-Chrome E2E run (demo mode, which executes the real backend
route handlers):

- Register (+ email verification step), login, logout, session state, protected routes
- Assignments: create, view, edit, delete, complete/pending, due date, priority, subject
- Subjects: create, list with counts, delete (blocked when in use)
- Files: upload (type and size validation, progress), list, download (byte-identical), delete
- Dashboard: total / pending / completed / overdue, upcoming, recent files
- Search, filters, sorting, dark mode, mobile layout
- Cross-user isolation (`404` for other users' records)

## Implemented but NOT yet verified against AWS

- Cognito sign-up, verification email, login and refresh with real tokens
- API Gateway JWT authorizer + CORS
- Lambda ↔ DynamoDB (adapter unit-tested with a fake client)
- S3 presigned POST/GET (signing unit-tested offline; real S3 round-trip untested)
- CloudFront hosting, CloudWatch alarms and dashboard, Budget

## In Progress

Nothing. Waiting for the first AWS deployment.

## Known Issues

- None found in local testing.
- Limitations are listed in README → Known limitations.

## AWS Resources

**None created yet.** `infrastructure/template.yaml` will create (stage `dev`):

| Type | Name |
| --- | --- |
| Cognito user pool / client | `student-cloud-manager-users-dev` / `student-cloud-manager-web-dev` |
| DynamoDB | `student-cloud-manager-{assignments,subjects,files}-dev` |
| S3 | `student-cloud-manager-files-dev-<account>`, `student-cloud-manager-web-dev-<account>` |
| Lambda | `student-cloud-manager-{assignments,subjects,files}-dev` |
| API Gateway | HTTP API (`ApiUrl` output) |
| CloudFront | distribution + OAC |
| CloudWatch | 4 log groups (14 days), 4 alarms, dashboard `student-cloud-manager-dev` |
| Optional | SNS topic `student-cloud-manager-alerts-dev`, budget `student-cloud-manager-monthly-dev` |

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

1. Install AWS CLI v2 + SAM CLI, then run `aws configure` (IAM user/SSO, not root; MFA on).
2. Check current pricing and free-tier status for the services.
3. `.\infrastructure\scripts\deploy.ps1 -AlertEmail <your email>` and confirm the SNS email.
4. Work through the **manual checklist in TESTING.md** on the CloudFront URL; record results.
5. Capture the AWS Console screenshots listed in `docs/presentation/DEMO_SCRIPT.md`.
6. Update this file, CHANGELOG.md and TODO.md with the verified state.

## Last Updated

2026-10-06
