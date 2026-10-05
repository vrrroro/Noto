# Final demo script (≈ 10 minutes)

Before the demo:

- [ ] Stack deployed, website opens on the CloudFront URL.
- [ ] AWS Console open in tabs: Cognito → User pools, DynamoDB → Tables → *Explore items*,
      S3 → files bucket, CloudWatch → Dashboards + Log groups, IAM → Roles.
- [ ] A small `DBMS_Unit_3.pdf` on the desktop.
- [ ] Backup plan: run `npm run dev` locally without `.env.local`. **Demo mode** runs the same app
      and backend logic entirely in the browser if the network fails.

| # | Show | Say |
| --- | --- | --- |
| 1 | Title slide | Students keep assignments and notes in scattered places: WhatsApp, email, pen drives. |
| 2 | Solution slide | One cloud platform for deadlines and notes, organised by subject. |
| 3 | `docs/architecture/architecture.png` | Walk through steps 1 to 4 on the diagram. "No server of ours runs continuously." |
| 4 | Register a new account | Cognito sends a verification code. We never store passwords. |
| 5 | Log in → dashboard | The browser receives a JWT, and every API call carries it. |
| 6 | Create "DBMS Assignment 3" | Request → API Gateway checks the token → Lambda validates → DynamoDB. |
| 7 | DynamoDB console → assignments table | The partition key is the user's Cognito `sub`. Ownership is built into the key. |
| 8 | Notes → upload `DBMS_Unit_3.pdf` | Lambda only signs an upload permit. The file goes straight to S3. |
| 9 | S3 console → `users/<sub>/files/…` | The bucket is private. Opening the object URL directly gives AccessDenied. |
| 10 | Download the file | A presigned link that expires in 5 minutes. |
| 11 | Mark the assignment complete → dashboard | The numbers update from real data. |
| 12 | CloudWatch → Lambda log group / dashboard | Structured logs: route, status, duration. No tokens or passwords. |
| 13 | Security slide | Cognito → JWT authorizer → validation → ownership (userId in keys) → IAM least privilege. |
| 14 | Scalability slide | 10 users to 10,000: API Gateway, Lambda and DynamoDB on-demand scale automatically. |
| 15 | Cost slide | Pay per request, nothing billed while idle, budget alert, throttling, `destroy.ps1` after the demo. |

## Screenshots to capture after deployment (for the report)

Store them in `docs/screenshots/` with an `aws-` prefix. Blur account IDs and emails.

- [ ] `aws-cognito-user-pool.png`: user pool overview and users list
- [ ] `aws-dynamodb-items.png`: assignments table items
- [ ] `aws-s3-files.png`: `users/<sub>/files/…` objects
- [ ] `aws-lambda-functions.png`: the three functions
- [ ] `aws-api-gateway-routes.png`: routes with the JWT authorizer attached
- [ ] `aws-cloudwatch-dashboard.png` and `aws-cloudwatch-logs.png`
- [ ] `aws-iam-role-policy.png`: one Lambda role's inline policy (least privilege)

The application screenshots (`app-*.png`) are already captured automatically by `e2e/run.mjs`.
