# Viva preparation

## The 30-second answer

> "Our application uses a serverless AWS architecture. Amazon Cognito handles authentication, API
> Gateway exposes our backend APIs, AWS Lambda runs our application logic, DynamoDB stores
> structured metadata such as assignments and file information, and Amazon S3 stores uploaded
> documents. CloudWatch is used for monitoring and logging, while IAM controls permissions between
> AWS services."

`User → Frontend (CloudFront + S3) → Cognito → API Gateway → Lambda → DynamoDB / S3`

## Core concepts

| Question | Answer |
| --- | --- |
| What is cloud computing? | Renting computing resources (servers, storage, databases) on demand over the internet and paying for what you use, instead of buying hardware. |
| Why is it useful? | No upfront hardware, scale up and down instantly, high availability built in, pay-as-you-go. |
| Region vs Availability Zone? | A region is a geographic area (e.g. Mumbai `ap-south-1`). An AZ is one or more isolated data centres inside it. Managed services like DynamoDB and Lambda run across several AZs automatically. |
| What is serverless? | The provider runs and scales the servers; we only supply code and configuration. Servers still exist, but we don't manage them, and we pay only when code runs. |
| Scalability vs availability? | Scalability means handling more load by adding capacity. Availability means staying reachable when parts fail. |

## Services

| Service | One-line answer | In our project |
| --- | --- | --- |
| IAM | Who can do what to which AWS resource. | Each Lambda has its own role with only the table and bucket actions it needs. |
| Cognito | Managed user sign-up, sign-in and tokens. | User pool with email verification; the API trusts its JWTs. |
| API Gateway | A managed front door for APIs. | HTTP API with a JWT authorizer, CORS and throttling. |
| Lambda | Runs code on demand without servers. | 3 functions: assignments, subjects, files. |
| DynamoDB | Managed NoSQL key-value/document database. | 3 tables keyed by `userId` + item ID. |
| S3 | Object storage for files. | Private files bucket + private website bucket. |
| CloudFront | Global CDN with HTTPS. | Serves the React app from edge locations. |
| CloudWatch | Logs, metrics, alarms, dashboards. | Lambda logs, API access logs, error alarms, dashboard. |

## Likely questions

**Why not store PDFs in DynamoDB?**
DynamoDB is for structured records, and an item is limited to 400 KB. S3 is built for files of any
size and is cheaper per GB. S3 stores the file; DynamoDB stores information *about* the file.

**How do you stop one student reading another's data?**
The backend never trusts a user ID from the browser. It takes `sub` from the JWT that API Gateway
verified, and every DynamoDB key and S3 key begins with that ID. Asking for someone else's ID simply
finds nothing and returns 404. We have automated tests for this.

**Why does the browser upload directly to S3?**
Lambda has request-size limits and charges per millisecond. A presigned POST lets S3 receive the
file directly while still enforcing our rules: exact key, content type, 10 MB maximum and a
5-minute expiry.

**What is a presigned URL?**
A URL signed with the Lambda's IAM credentials that grants one specific operation on one object for
a short time.

**What is a JWT?**
A signed token containing claims such as the user ID (`sub`) and expiry. API Gateway checks the
signature against Cognito's public keys, so it can't be forged.

**Why DynamoDB and not MySQL/RDS?**
No server to run, on-demand pricing that is near zero when idle, automatic scaling. Our access
patterns are simple key lookups ("all assignments for user X"), which suit DynamoDB.

**Why is the partition key `userId`?**
Our main query is "everything for this user". With `userId` as the partition key that is a single
`Query`, and ownership is enforced by the key itself.

**What happens if Lambda fails?**
The API returns a clean 500 error, the UI shows "Something went wrong" with a Retry button, the
details go to CloudWatch, and an alarm fires.

**What if 10 users become 10,000?**
API Gateway and Lambda scale out automatically, and DynamoDB on-demand absorbs the traffic. We would
raise throttling limits and quotas and switch Cognito email to SES. No architecture change is needed.

**How do you control cost?**
Everything is pay-per-request with nothing running while idle. We use log retention, API throttling,
a 10 MB file cap, an AWS Budget email alert, and we delete the stack after the demo.

**What is least privilege?**
Give each component only the permissions it needs. The files Lambda can only touch the files table,
read subjects, and access objects under `users/*` in one bucket.

**Why is CORS needed?**
The website (CloudFront domain) calls a different domain (API Gateway). Browsers block that unless
the API explicitly allows our origin. We allow only our own site, not `*`.

**What is infrastructure as code?**
Our whole AWS setup is in `template.yaml`. One command creates it identically every time, and one
command deletes it.

**What would you add next?**
Email reminders (EventBridge Scheduler + SES), a calendar view, professor accounts, and S3 event
notifications to confirm uploads.
