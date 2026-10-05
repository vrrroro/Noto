# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### AWS

- First deployment to AWS pending (see PROJECT_CONTEXT.md → Next Task).

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
