# Security

> The frontend is **not** the security boundary. The backend is.

## Layers

| Layer | Control | Where |
| --- | --- | --- |
| Transport | HTTPS only: CloudFront redirects HTTP; both buckets deny non-TLS requests; Cognito and API Gateway are HTTPS-only | `template.yaml` |
| Authentication | Cognito user pool: verified email, password policy (8+ chars, upper, lower, number), refresh token revocation, user-existence errors hidden at sign-in | `UserPool`, `UserPoolClient` |
| API authorization | HTTP API **JWT authorizer** on every route: signature, issuer, `client_id` and expiry checked before Lambda runs | `HttpApi.Auth` |
| Identity | `userId` comes only from `requestContext.authorizer.jwt.claims.sub` | `backend/src/shared/http.js` |
| Ownership | DynamoDB keys are `(userId, id)`, so reads, updates and deletes can only address the caller's items; S3 keys start with `users/{userId}/` | `dynamoRepository.js`, `apps/files.js` |
| Input validation | Strict lengths, enums, real dates, file types, sizes, sanitised file names; unknown fields ignored | `backend/src/shared/validation.js` |
| File access | Private buckets with Block Public Access and bucket-owner-enforced ownership; presigned URLs valid 5 minutes for one key; uploads restricted to an exact content type and 1 B–10 MB | `s3Storage.js` |
| Least privilege | One IAM role per Lambda, listing the exact DynamoDB actions per table and S3 actions on `users/*` only; no `AdministratorAccess`, no wildcards on actions | `template.yaml` Policies |
| Error hygiene | Clients get generic messages; stack traces and AWS errors go to CloudWatch only | `createHttpHandler` |
| Logging | Structured JSON logs with route, status, IDs and duration. **No** bodies, headers, tokens or passwords | `backend/src/shared/logger.js` |
| Abuse / cost | API throttling (10 req/s, burst 20), file size limit, budget alert | `template.yaml` |
| Browser hardening | CloudFront managed *SecurityHeadersPolicy* (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) | `WebDistribution` |

## How cross-user access is prevented (walk-through)

User A requests `DELETE /assignments/<B's assignment id>` with A's valid token:

1. API Gateway accepts the token because it is a valid token, for user A.
2. Lambda reads `sub = A` from the verified claims.
3. DynamoDB `DeleteItem` runs with key `{ userId: "A", assignmentId: "<B's id>" }` and the condition
   `attribute_exists(assignmentId)`.
4. No such item exists under A's partition, so the condition fails and the API returns
   `404 ASSIGNMENT_NOT_FOUND`. B's item is untouched.

Returning `404` instead of `403` avoids revealing whether the ID exists at all. The same pattern
protects subjects and files (including download links). This is covered by automated tests
(`backend/test/*.test.js`: "user B cannot …") and by the end-to-end run.

## Secrets

- No AWS access keys exist in the code or the frontend. Lambdas use their IAM role, and deployment
  uses your local AWS CLI profile.
- The Cognito app client has **no client secret** (correct for public browser clients).
- `VITE_*` values are public identifiers, not secrets. `.env` / `.env.*` are git-ignored, and only
  `.env.example` is committed.
- Demo mode keeps a salted SHA-256 **hash** of demo passwords in `localStorage` purely to
  demonstrate "wrong password". Demo mode is clearly labelled and never used with AWS.

## CORS

- API Gateway allows only the CloudFront domain of the same stack plus `LocalDevOrigin`
  (default `http://localhost:5173`) for development, never `*`.
- The files bucket allows `POST` only from the same two origins.
- For a production stage, deploy with `LocalDevOrigin` set to the CloudFront URL to drop the
  localhost origin.

## Known trade-offs

| Trade-off | Why accepted | Stronger option |
| --- | --- | --- |
| Tokens stored in `localStorage` | Simple SPA pattern; XSS risk is reduced by React's escaping and no third-party scripts | Hosted UI + authorization-code flow with HTTP-only cookies via a backend |
| `USER_PASSWORD_AUTH` flow (password sent over TLS to Cognito) | No SDK dependency; easy to explain | SRP auth via Amplify (password never leaves the browser) |
| Subject-name uniqueness checked with read-then-write | Single user, negligible race risk | Conditional write on a normalised-name key |
| Orphaned S3 objects if `/complete` is never called | Rare; the metadata expires via TTL | S3 event notification to reconcile |

## Security checklist (CLAUDE.md §99)

- [x] No credentials committed
- [x] `.env` ignored
- [x] `.env.example` provided
- [x] Cognito used for authentication
- [x] Backend validates ownership (key design + tests)
- [x] IAM follows least privilege (per-function inline policies)
- [x] S3 permissions reviewed (private, BPA, TLS-only, presigned, `users/*` scope)
- [x] File size restricted (client, Lambda and S3 policy)
- [x] File type restricted (client and Lambda; content type set by server)
- [x] Input validation implemented
- [x] Sensitive information excluded from logs
- [x] CORS reviewed (no wildcard origins)
- [x] Error messages sanitised
- [ ] Verified against a live deployment (pending first deploy; see TESTING.md)
