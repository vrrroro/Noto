# TODO

Legend: `[x]` done and verified locally · `[~]` implemented, awaiting verification on AWS · `[ ]` not started

## P0 - Must Have

- [x] Initialize frontend
- [x] Configure Cognito (deployed, live sign-in verified)
- [x] Implement login (demo mode verified; Cognito path awaiting AWS)
- [x] Implement registration + email verification
- [x] Create DynamoDB tables (deployed)
- [x] Implement assignment CRUD
- [x] Configure API Gateway (deployed, JWT + CORS verified)
- [x] Implement S3 file upload (real S3 round-trip verified)
- [x] Implement dashboard
- [x] **Deploy to AWS** (backend, 2026-10-08; live API 35/35)
- [x] **Put the website online** (AWS Amplify Hosting, https://main.dg6fh880g1p8b.amplifyapp.com; live site 16/16)
- [ ] Get the account verified for CloudFront, then redeploy with CloudFront + `-AlertEmail`
- [ ] **Run the live manual UI checklist** in TESTING.md (sign-up with a real email)
- [ ] Delete or restrict the `scm-deployer` access key after the demo
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
