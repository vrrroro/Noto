# TODO

Legend: `[x]` done and verified locally · `[~]` implemented, awaiting verification on AWS · `[ ]` not started

## P0 - Must Have

- [x] Initialize frontend
- [~] Configure Cognito (in `template.yaml`)
- [x] Implement login (demo mode verified; Cognito path awaiting AWS)
- [x] Implement registration + email verification
- [~] Create DynamoDB tables (in `template.yaml`)
- [x] Implement assignment CRUD
- [~] Configure API Gateway (HTTP API + JWT authorizer in `template.yaml`)
- [x] Implement S3 file upload (presigned POST; real S3 round-trip awaiting AWS)
- [x] Implement dashboard
- [ ] **Deploy to AWS**: `infrastructure/scripts/deploy.ps1`
- [ ] **Run the live manual checklist** in TESTING.md
- [ ] Capture AWS Console screenshots (docs/presentation/DEMO_SCRIPT.md)

## P1 - Important

- [x] Add search
- [x] Add filtering (subject, status, file type) and sorting
- [x] Improve error handling (envelope, sanitised errors, retry states)
- [x] Add tests (unit, E2E, IaC lint)
- [~] Add CloudWatch monitoring (log retention, alarms, dashboard)
- [~] Billing alert (AWS Budget, enabled with `-AlertEmail`)
- [ ] After the live run: narrow `LocalDevOrigin` for any non-dev stage

## P2 - Nice to Have

- [x] Dark mode
- [x] File upload progress
- [ ] Calendar view
- [ ] Email reminders (EventBridge Scheduler + SES)
- [ ] Rename subject
- [ ] S3 event notification to reconcile orphaned uploads
- [ ] CI pipeline (GitHub Actions: tests + cfn-lint)
