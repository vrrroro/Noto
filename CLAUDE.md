# CLAUDE.md

# Cloud-Based Student Assignment & Notes Management System

> **Project Type:** AWS Cloud Computing / Serverless Web Application  
> **Primary Goal:** Build a simple but complete cloud-native student assignment and notes management platform using AWS managed services.  
> **Development Style:** Production-minded, beginner-friendly, cost-conscious, security-conscious, incremental.  
> **Primary Developer:** Rohit  
> **Repository Status:** Active Development  
> **Document Status:** Living Source of Truth  
> **Last Updated:** 2026-10-06

---

# 1. PROJECT CONSTITUTION

## 1.1 Read This First

This file is the **single source of truth for the project**.

Before doing any meaningful development work, Claude must:

1. Read this entire file.
2. Inspect the current repository structure.
3. Inspect the current implementation before changing it.
4. Check the current project status.
5. Check `CHANGELOG.md` if it exists.
6. Check `PROJECT_CONTEXT.md` if it exists.
7. Check `TODO.md` if it exists.
8. Understand which features are already implemented.
9. Never assume that an unfinished feature is completely absent.
10. Never rewrite working code unnecessarily.

This project should be developed **incrementally**.

Do not attempt to build the entire system in one giant change.

---

# 2. PROJECT VISION

## 2.1 What Are We Building?

We are building a cloud-based platform for students to manage:

- assignments
- academic notes
- uploaded documents
- assignment deadlines
- completion status
- basic academic file organization

The system should allow a student to:

1. Create an account.
2. Log in securely.
3. View their assignments.
4. Create assignments.
5. Set deadlines.
6. Mark assignments as completed.
7. Upload notes/files.
8. View uploaded files.
9. Download files.
10. Delete their own files.
11. Organize academic content by subject.

The application should demonstrate real AWS cloud architecture without requiring an unnecessarily complicated backend.

---

# 3. PROJECT OBJECTIVES

## 3.1 Primary Objectives

The project must demonstrate practical use of AWS services.

The final system should demonstrate:

- Authentication
- Serverless backend
- REST API
- Cloud database
- Object/file storage
- Static web hosting
- Monitoring
- Logging
- IAM-based security
- Cloud architecture
- Cost awareness

---

## 3.2 Academic Objectives

The project should allow us to explain the following concepts during a college presentation/viva:

### Cloud Computing

- What cloud computing is
- Why cloud services are useful
- Scalability
- Availability
- Managed services
- Pay-as-you-go architecture

### AWS

- AWS regions
- Availability Zones
- IAM
- S3
- Lambda
- API Gateway
- DynamoDB
- Cognito
- CloudWatch
- CloudFront

### Serverless Architecture

Explain:

> Instead of running our own server continuously, we use AWS services that run only when needed.

Example:

```text
Student
   ↓
Website
   ↓
API Gateway
   ↓
Lambda
   ↓
DynamoDB
```

---

# 4. NON-GOALS

The following are intentionally NOT part of the initial project.

Do not introduce these unless explicitly requested:

- AI grading
- AI chatbot
- video processing
- real-time chat
- payment systems
- social networking
- complex recommendation systems
- mobile application
- microservices architecture
- Kubernetes
- Docker unless specifically required
- complex CI/CD pipelines
- multi-region deployment
- machine learning
- complicated role management
- professor grading workflows
- plagiarism detection
- OCR
- email campaigns

The project should remain simple.

The goal is:

> **Maximum AWS learning value with minimum unnecessary complexity.**

---

# 5. CORE USER PERSONA

## Student

A university student who wants one place to manage academic assignments and notes.

### Student needs

- Know what assignments are pending.
- Know what is due soon.
- Upload notes.
- Find notes quickly.
- Download files.
- Mark assignments complete.
- Access everything from a browser.

---

# 6. MVP DEFINITION

The Minimum Viable Product must contain:

## Authentication

- Register
- Login
- Logout
- Authentication state

## Assignments

- Create assignment
- View assignments
- Edit assignment
- Delete assignment
- Mark complete
- Set due date
- Associate with subject

## Notes / Files

- Upload file
- View uploaded files
- Download file
- Delete file
- Associate file with subject

## Subjects

- Create subject
- View subjects

## Dashboard

Display:

- Total assignments
- Pending assignments
- Completed assignments
- Upcoming deadlines
- Recent uploaded files

---

# 7. OPTIONAL FEATURES

Only implement optional features after MVP is stable.

Possible additions:

- Search
- Filter by subject
- Filter by completion
- Sort by deadline
- Dark mode
- File type filtering
- Assignment priority
- Calendar view
- Professor/admin account
- Email reminders
- File upload progress
- Recently accessed files

Never sacrifice MVP stability to implement optional features.

---

# 8. AWS ARCHITECTURE

## 8.1 Target Architecture

The intended architecture is:

```text
                    INTERNET
                       |
                       v
              +----------------+
              |   CloudFront   |
              +-------+--------+
                      |
                      v
              +----------------+
              |      S3        |
              | Static Website |
              +----------------+

                       |
                       |
                   HTTPS API
                       |
                       v
              +----------------+
              | API Gateway    |
              +-------+--------+
                      |
                      v
              +----------------+
              |    Lambda      |
              | Backend Logic  |
              +---+--------+---+
                  |        |
                  |        |
                  v        v
          +-----------+  +-----------+
          | DynamoDB  |  |    S3     |
          | Metadata  |  | Documents |
          +-----------+  +-----------+

              +----------------+
              |    Cognito     |
              | Authentication |
              +----------------+

              +----------------+
              |  CloudWatch    |
              | Logs/Monitoring |
              +----------------+

              +----------------+
              |      IAM       |
              | Permissions    |
              +----------------+
```

---

# 9. AWS SERVICES

## 9.1 Amazon S3

### Purpose

S3 stores uploaded student files.

Examples:

```text
DBMS_Unit_3.pdf
OS_Notes.pdf
AI_Assignment.pdf
Cloud_Computing_Notes.pdf
```

### S3 responsibilities

- Store frontend static assets.
- Store uploaded documents.
- Store downloadable objects.

### Important rule

Never store sensitive authentication information inside S3.

---

# 10. Amazon DynamoDB

## Purpose

DynamoDB stores structured application data.

Example assignment:

```json
{
  "assignmentId": "assignment-123",
  "userId": "user-456",
  "title": "DBMS Assignment 3",
  "subject": "DBMS",
  "description": "Normalization problems",
  "dueDate": "2026-10-15",
  "completed": false,
  "createdAt": "2026-10-06T10:00:00Z"
}
```

Example file metadata:

```json
{
  "fileId": "file-123",
  "userId": "user-456",
  "fileName": "DBMS_Unit_3.pdf",
  "subject": "DBMS",
  "s3Key": "users/user-456/files/file-123.pdf",
  "contentType": "application/pdf",
  "uploadedAt": "2026-10-06T10:00:00Z"
}
```

---

# 11. AWS Lambda

## Purpose

Lambda contains backend business logic.

Example responsibilities:

- Create assignment
- Get assignments
- Update assignment
- Delete assignment
- Generate file upload information
- Get file metadata
- Delete file metadata
- Validate user ownership

Lambda should NOT contain unnecessary logic that belongs in the frontend.

---

# 12. API Gateway

API Gateway exposes backend functionality over HTTP.

Example endpoints:

```text
GET    /assignments
POST   /assignments
GET    /assignments/{id}
PUT    /assignments/{id}
DELETE /assignments/{id}

GET    /files
POST   /files
DELETE /files/{id}

GET    /subjects
POST   /subjects
DELETE /subjects/{id}
```

---

# 13. Amazon Cognito

Cognito handles:

- User registration
- Login
- Authentication
- Identity
- Access tokens

The application must NOT store user passwords manually.

Never create a custom password database for this project.

---

# 14. CloudWatch

CloudWatch is used for:

- Lambda logs
- API monitoring
- debugging
- observing errors

During development, Lambda logs should contain useful information without exposing secrets.

Never log:

- passwords
- authentication tokens
- secret keys
- private credentials

---

# 15. IAM

IAM controls what AWS resources can access each other.

Use the principle of least privilege.

This means:

> Give each AWS component only the permissions it actually needs.

For example:

Lambda should not automatically receive administrator permissions.

---

# 16. CLOUDFRONT

CloudFront may be used in front of the frontend/static content.

Purpose:

- Content delivery
- HTTPS
- Better global access
- Demonstration of CDN concepts

CloudFront is optional for the absolute MVP but recommended for the final architecture if the configuration remains simple and cost-controlled.

---

# 17. FRONTEND

## Recommended Technology

Use:

- HTML
- CSS
- JavaScript

OR:

- React
- Vite

### Default recommendation

Use **React + Vite** if the team is comfortable with React.

Use plain HTML/CSS/JS if the goal is maximum simplicity.

Do not introduce Next.js unless there is a clear reason.

---

# 18. FRONTEND STRUCTURE

Recommended React structure:

```text
src/
├── components/
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   ├── AssignmentCard.jsx
│   ├── AssignmentForm.jsx
│   ├── FileCard.jsx
│   ├── FileUpload.jsx
│   └── LoadingSpinner.jsx
│
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Assignments.jsx
│   ├── Notes.jsx
│   └── Subjects.jsx
│
├── services/
│   ├── api.js
│   ├── auth.js
│   └── files.js
│
├── hooks/
│   └── useAuth.js
│
├── utils/
│   └── date.js
│
├── App.jsx
├── main.jsx
└── styles/
    └── global.css
```

Keep components small.

Avoid giant components containing 500+ lines.

---

# 19. BACKEND STRUCTURE

Recommended:

```text
backend/
├── lambdas/
│   ├── assignments/
│   │   ├── create.js
│   │   ├── get.js
│   │   ├── update.js
│   │   └── delete.js
│   │
│   ├── files/
│   │   ├── createUploadUrl.js
│   │   ├── get.js
│   │   └── delete.js
│   │
│   └── subjects/
│       ├── create.js
│       ├── get.js
│       └── delete.js
│
└── shared/
    ├── response.js
    ├── validation.js
    └── constants.js
```

If the number of Lambda functions becomes unnecessarily large, consolidation is allowed.

Prefer clarity over artificial microservices.

---

# 20. DATABASE DESIGN

## 20.1 Assignment Entity

Required attributes:

```text
assignmentId
userId
title
description
subject
dueDate
completed
priority
createdAt
updatedAt
```

---

## 20.2 File Entity

Required attributes:

```text
fileId
userId
fileName
subject
s3Key
contentType
fileSize
uploadedAt
```

---

## 20.3 Subject Entity

Required attributes:

```text
subjectId
userId
name
createdAt
```

---

# 21. DATA OWNERSHIP

Every user-owned record must contain a `userId`.

Example:

```text
userId = abc123
```

When retrieving assignments:

```text
WHERE userId == authenticatedUserId
```

Do not trust a `userId` sent by the frontend.

The backend must obtain the authenticated user's identity from the authentication context/token.

---

# 22. CRITICAL SECURITY RULE

A user must NEVER be able to access another user's data.

For example:

User A:

```text
userId = A
```

User B:

```text
userId = B
```

If User A requests:

```text
GET /assignments/B's-assignment
```

the backend must reject the request.

The frontend is NOT the security boundary.

The backend is.

---

# 23. FILE STORAGE STRUCTURE

Use an S3 key pattern similar to:

```text
users/{userId}/files/{fileId}/{fileName}
```

Example:

```text
users/abc123/files/file789/DBMS_Notes.pdf
```

This makes ownership easy to understand.

---

# 24. FILE UPLOAD DESIGN

Preferred flow:

```text
Student
   |
   | "Upload DBMS.pdf"
   v
Frontend
   |
   | request upload authorization
   v
API Gateway
   |
   v
Lambda
   |
   | generate controlled upload URL
   v
Frontend
   |
   | upload file
   v
S3
```

Do not send large files unnecessarily through Lambda.

Use direct-to-S3 upload mechanisms where appropriate.

---

# 25. FILE VALIDATION

The application should validate:

- file type
- file size
- filename
- authenticated user
- subject

Initial allowed file types:

```text
.pdf
.doc
.docx
.ppt
.pptx
.txt
.png
.jpg
.jpeg
```

Initial maximum size:

```text
10 MB
```

The exact limit can be changed later.

---

# 26. UI REQUIREMENTS

## Login Page

Must contain:

- Email
- Password
- Login button
- Register link
- Error state
- Loading state

---

## Register Page

Must contain:

- Email
- Password
- Confirm password
- Register button
- Login link

---

# 27. DASHBOARD

Dashboard should show:

```text
Hello, Student 👋

--------------------------------
Assignments
--------------------------------

Total:       12
Pending:      7
Completed:    5

--------------------------------
Upcoming
--------------------------------

DBMS Assignment       Oct 10
AI Assignment         Oct 12
Cloud Assignment     Oct 15

--------------------------------
Recent Files
--------------------------------

DBMS Notes.pdf
AI Module 3.pdf
AWS Notes.pdf
```

The dashboard should be simple.

Do not over-design it.

---

# 28. ASSIGNMENTS PAGE

Features:

```text
+ Create Assignment
```

Each assignment card:

```text
DBMS Assignment 3

Subject: DBMS
Due: 15 October 2026
Priority: High

[Complete] [Edit] [Delete]
```

---

# 29. NOTES PAGE

Display:

```text
My Notes

+ Upload File

--------------------------------

DBMS_Unit_3.pdf
DBMS
PDF
1.2 MB

[Download] [Delete]
```

---

# 30. SUBJECTS PAGE

Example:

```text
My Subjects

DBMS
Operating Systems
Artificial Intelligence
Cloud Computing
Software Engineering
Advanced Competitive Coding
```

Users should be able to create subjects.

---

# 31. ERROR HANDLING

Every API should have predictable error responses.

Example:

```json
{
  "success": false,
  "error": {
    "code": "ASSIGNMENT_NOT_FOUND",
    "message": "Assignment not found."
  }
}
```

Success:

```json
{
  "success": true,
  "data": {}
}
```

Do not return random error formats from different Lambda functions.

---

# 32. HTTP STATUS CODES

Use appropriate status codes.

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

# 33. VALIDATION

Validate data at the backend.

Example:

Assignment title:

```text
Required
Minimum: 1 character
Maximum: 150 characters
```

Description:

```text
Optional
Maximum: 2000 characters
```

Subject:

```text
Required
```

Due date:

```text
Required
Valid date
```

---

# 34. SECURITY REQUIREMENTS

Never commit:

```text
AWS access keys
AWS secret keys
.env files containing secrets
Cognito secrets
database credentials
private tokens
```

Use environment variables or AWS-native mechanisms.

---

# 35. IAM RULES

NEVER use:

```text
AdministratorAccess
```

for application Lambda functions.

Use specific permissions.

Example conceptual permissions:

```text
Lambda Assignment Function
    ↓
DynamoDB
    ↓
Only required table operations
```

Not:

```text
Lambda
    ↓
Entire AWS Account
```

---

# 36. AWS COST SAFETY

This project is specifically intended to be inexpensive.

Before creating AWS resources:

1. Check current AWS pricing/free-tier eligibility.
2. Understand whether the selected service has free usage.
3. Create a billing alert.
4. Avoid unnecessary resources.
5. Delete unused resources.
6. Do not create large storage volumes.
7. Do not generate unnecessary traffic.
8. Do not leave expensive services running.

Never claim that a service is "free forever."

AWS pricing and free-tier rules can change.

---

# 37. DEVELOPMENT ENVIRONMENT

Recommended:

```text
Node.js
npm
Git
VS Code
AWS Account
AWS CLI
AWS Console
```

Optional:

```text
AWS SAM
AWS CDK
```

Do not introduce infrastructure-as-code until the basic architecture is understood.

---

# 38. GIT WORKFLOW

Use Git from the beginning.

Initial commit:

```text
chore: initialize project
```

Examples:

```text
feat: add authentication
feat: add assignment creation
feat: add assignment dashboard
feat: add file upload
fix: prevent cross-user assignment access
docs: add AWS architecture documentation
test: add assignment API tests
refactor: simplify assignment service
```

---

# 39. COMMIT RULES

Commits should:

- be small
- describe one logical change
- avoid unrelated changes
- be easy to revert

Avoid:

```text
update
changes
final
final2
final-final
```

Prefer:

```text
feat: implement assignment creation API
```

---

# 40. BRANCHING

For a solo academic project, simple branching is enough.

Main:

```text
main
```

Feature branches:

```text
feature/authentication
feature/assignments
feature/file-upload
feature/dashboard
```

Merge stable work into `main`.

---

# 41. PROJECT DIRECTORY

Recommended root:

```text
student-cloud-manager/
│
├── CLAUDE.md
├── README.md
├── CHANGELOG.md
├── PROJECT_CONTEXT.md
├── TODO.md
├── ARCHITECTURE.md
├── SECURITY.md
├── API.md
├── TESTING.md
├── .gitignore
│
├── frontend/
│
├── backend/
│
├── infrastructure/
│
└── docs/
    ├── screenshots/
    ├── architecture/
    └── presentation/
```

---

# 42. PROJECT_CONTEXT.md

Maintain a compact current-state document.

It must answer:

```text
What are we building?
What is already working?
What is currently broken?
What is being worked on?
What AWS resources exist?
What remains?
What decisions have been made?
What should Claude do next?
```

Update it after significant changes.

---

# 43. PROJECT CONTEXT TEMPLATE

```md
# Project Context

## Current Phase

Phase 0 - Setup

## Current Status

Not started.

## Working Features

- None

## In Progress

- Project initialization

## Known Issues

- None

## AWS Resources

- None created

## Current Architecture

Not deployed.

## Next Task

Initialize frontend and backend structure.

## Important Decisions

- React + Vite frontend
- AWS serverless architecture
- Cognito for authentication
- DynamoDB for metadata
- S3 for files
- Lambda for backend
- API Gateway for API

## Last Updated

2026-10-06
```

---

# 44. CHANGELOG.md

Every meaningful feature or architectural change must be recorded.

Use:

```md
# Changelog

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

### Security

### AWS

---

## [0.1.0] - 2026-10-06

### Added

- Initial project structure
- Project documentation
```

---

# 45. CHANGELOG RULE

After completing a meaningful feature:

1. Update `CHANGELOG.md`.
2. Update `PROJECT_CONTEXT.md`.
3. Update `TODO.md`.
4. Update documentation if architecture changed.
5. Mention tests performed.
6. Mention AWS resources created or modified.

---

# 46. TODO.md

Use priorities.

```md
# TODO

## P0 - Must Have

- [ ] Initialize frontend
- [ ] Configure Cognito
- [ ] Implement login
- [ ] Implement registration
- [ ] Create DynamoDB tables
- [ ] Implement assignment CRUD
- [ ] Configure API Gateway
- [ ] Implement S3 file upload
- [ ] Implement dashboard

## P1 - Important

- [ ] Add search
- [ ] Add filtering
- [ ] Improve error handling
- [ ] Add tests
- [ ] Add CloudWatch monitoring

## P2 - Nice to Have

- [ ] Dark mode
- [ ] Calendar
- [ ] Email reminders
```

---

# 47. DEVELOPMENT PHASES

Never skip directly to the final system.

---

# PHASE 0 - PLANNING

Deliverables:

```text
CLAUDE.md
README.md
PROJECT_CONTEXT.md
CHANGELOG.md
TODO.md
ARCHITECTURE.md
```

No AWS resources required yet.

---

# PHASE 1 - LOCAL FRONTEND

Build:

- Login UI
- Registration UI
- Dashboard UI
- Assignment UI
- Notes UI

Initially use mock data.

Goal:

> Make the interface work before connecting AWS.

---

# PHASE 2 - AWS AUTHENTICATION

Implement Cognito.

Tasks:

1. Create user pool.
2. Configure sign-up.
3. Configure sign-in.
4. Connect frontend.
5. Handle authentication state.
6. Implement logout.
7. Protect private routes.

Acceptance criteria:

```text
Unauthenticated user
    ↓
Login page

Authenticated user
    ↓
Dashboard
```

---

# PHASE 3 - DYNAMODB

Create assignment storage.

Implement:

```text
Create
Read
Update
Delete
```

Acceptance criteria:

- User can create assignment.
- Assignment appears after refresh.
- Assignment persists.
- User can edit it.
- User can delete it.
- User cannot access another user's assignment.

---

# PHASE 4 - API GATEWAY + LAMBDA

Connect frontend to backend.

Implement:

```text
GET /assignments
POST /assignments
PUT /assignments/{id}
DELETE /assignments/{id}
```

Test each endpoint independently.

---

# PHASE 5 - S3 FILE STORAGE

Implement:

```text
Upload
List
Download
Delete
```

Acceptance criteria:

- File reaches S3.
- Metadata reaches DynamoDB.
- User sees file in UI.
- User can download file.
- User can delete file.
- User cannot access another user's file.

---

# PHASE 6 - DASHBOARD

Connect real data.

Dashboard calculates:

```text
Total assignments
Pending assignments
Completed assignments
Upcoming assignments
Recent files
```

---

# PHASE 7 - MONITORING

Configure:

- CloudWatch logs
- Basic metrics
- Error observation
- Billing alert

---

# PHASE 8 - SECURITY REVIEW

Check:

- IAM permissions
- Authentication
- Authorization
- S3 access
- Input validation
- File validation
- Secrets
- CORS
- Error responses

---

# PHASE 9 - TESTING

Test:

### Authentication

```text
Valid login
Invalid login
Logout
Unauthenticated route
```

### Assignments

```text
Create
Read
Update
Delete
Complete
Invalid input
Unauthorized access
```

### Files

```text
Upload
Download
Delete
Invalid type
Oversized file
Unauthorized access
```

---

# PHASE 10 - DOCUMENTATION

Produce:

```text
README.md
ARCHITECTURE.md
API.md
SECURITY.md
TESTING.md
```

Also capture screenshots for:

- AWS architecture
- Cognito
- S3
- DynamoDB
- Lambda
- API Gateway
- CloudWatch
- Application dashboard

---

# PHASE 11 - FINAL DEMO

The final demonstration should follow:

```text
1. Explain problem
2. Explain solution
3. Explain architecture
4. Register user
5. Login
6. Create assignment
7. Show database
8. Upload file
9. Show S3
10. Download file
11. Mark assignment complete
12. Show CloudWatch
13. Explain security
14. Explain scalability
15. Explain cost control
```

---

# 48. API CONTRACT

## GET /assignments

Response:

```json
{
  "success": true,
  "data": [
    {
      "assignmentId": "123",
      "title": "DBMS Assignment",
      "subject": "DBMS",
      "dueDate": "2026-10-15",
      "completed": false
    }
  ]
}
```

---

## POST /assignments

Request:

```json
{
  "title": "DBMS Assignment",
  "description": "Complete normalization questions",
  "subject": "DBMS",
  "dueDate": "2026-10-15",
  "priority": "HIGH"
}
```

---

## PUT /assignments/{id}

Request:

```json
{
  "completed": true
}
```

---

## DELETE /assignments/{id}

Response:

```json
{
  "success": true,
  "message": "Assignment deleted."
}
```

---

# 49. API VALIDATION

Reject:

```json
{
  "title": ""
}
```

Reject:

```json
{
  "dueDate": "banana"
}
```

Reject requests without authentication.

Reject requests attempting to access another user's resource.

---

# 50. FRONTEND STATE RULES

The frontend should clearly distinguish:

```text
loading
success
empty
error
```

Do not leave the user staring at a blank screen.

Example:

```text
Loading assignments...

No assignments yet.

Failed to load assignments.
[Retry]
```

---

# 51. UX RULES

The application should feel simple.

Prefer:

```text
clear buttons
clear forms
clear error messages
consistent spacing
```

Avoid:

```text
unnecessary animations
huge menus
excessive gradients
confusing navigation
```

The application is an academic productivity tool, not a gaming website.

---

# 52. ACCESSIBILITY

Use:

- semantic HTML
- labels for inputs
- keyboard-friendly controls
- readable contrast
- meaningful button labels
- alt text for meaningful images

Do not make buttons that only contain unexplained icons.

---

# 53. RESPONSIVE DESIGN

The application should work on:

```text
Desktop
Laptop
Tablet
Mobile
```

The primary development target can be desktop.

---

# 54. TESTING STRATEGY

Testing should happen continuously.

Do not wait until the end.

---

# 55. UNIT TESTING

Test backend functions for:

- validation
- assignment creation
- ownership checks
- error handling
- response formatting

---

# 56. INTEGRATION TESTING

Test:

```text
Frontend
   ↓
API Gateway
   ↓
Lambda
   ↓
DynamoDB
```

and:

```text
Frontend
   ↓
S3
```

---

# 57. MANUAL TEST CHECKLIST

## Authentication

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Wrong password
- [ ] Invalid email
- [ ] Protected page

## Assignments

- [ ] Create
- [ ] View
- [ ] Edit
- [ ] Delete
- [ ] Complete
- [ ] Invalid data

## Files

- [ ] Upload PDF
- [ ] Upload image
- [ ] Download
- [ ] Delete
- [ ] Reject oversized file
- [ ] Reject unsupported file

## Security

- [ ] User A cannot see User B assignments
- [ ] User A cannot delete User B assignments
- [ ] User A cannot download User B files

---

# 58. DEFINITION OF DONE

A feature is NOT considered complete merely because the code exists.

A feature is complete when:

- [ ] Code implemented
- [ ] Code runs
- [ ] Happy path tested
- [ ] Error path tested
- [ ] Authentication considered
- [ ] Authorization considered
- [ ] Logs are reasonable
- [ ] No secrets committed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Project context updated
- [ ] TODO updated
- [ ] Git commit created

---

# 59. SENIOR SOFTWARE ENGINEERING BEHAVIOR

Claude must behave like a careful senior software engineer.

That means:

## Before coding

Understand the problem.

Ask:

```text
What are we changing?
Why are we changing it?
What existing code depends on it?
What could break?
How will we test it?
```

---

## While coding

Prefer:

- small changes
- readable code
- reusable functions
- clear names
- predictable behavior
- minimal dependencies

Avoid:

- giant rewrites
- unnecessary abstractions
- premature optimization
- random libraries
- duplicated logic
- unexplained magic numbers

---

## After coding

Always:

1. Run relevant tests.
2. Inspect the resulting code.
3. Check for errors.
4. Update documentation.
5. Update project context.
6. Update changelog.

---

# 60. DO NOT GUESS

If information is missing, inspect the repository first.

Do not assume:

```text
file exists
function exists
AWS resource exists
API endpoint exists
environment variable exists
dependency is installed
```

Verify.

---

# 61. DO NOT DESTROY WORKING CODE

Before modifying an existing feature:

1. Understand it.
2. Identify dependencies.
3. Make the smallest reasonable change.
4. Test it.

Do not rewrite an entire file just to change one function.

---

# 62. DEPENDENCY POLICY

Before installing a dependency ask:

> Can this be implemented cleanly without another dependency?

If yes, prefer the simpler solution.

If a dependency is necessary:

- explain why
- use a maintained package
- use a stable version
- update documentation

---

# 63. ENVIRONMENT VARIABLES

Use:

```text
.env
```

for local configuration.

Example:

```text
VITE_AWS_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_API_URL=
```

Never commit `.env`.

Commit:

```text
.env.example
```

Example:

```text
VITE_AWS_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_API_URL=
```

---

# 64. CONFIGURATION RULE

Never hardcode:

```text
API URLs
AWS region
Cognito IDs
resource IDs
```

unless there is a specific documented reason.

---

# 65. CORS

Configure CORS carefully.

Do not blindly use:

```text
Access-Control-Allow-Origin: *
```

for authenticated production behavior if a narrower origin can be used.

During development, broader configuration may temporarily be necessary.

Document it.

---

# 66. LOGGING

Logs should help answer:

```text
What happened?
Where did it happen?
Did it succeed?
If it failed, why?
```

Good:

```text
Assignment creation started
Assignment created successfully
```

Bad:

```text
PASSWORD=...
TOKEN=...
```

---

# 67. ERROR HANDLING

Never expose internal AWS errors directly to the user.

Bad:

```text
DynamoDB ValidationException: ConditionalCheckFailedException...
```

Better:

```text
Unable to update assignment.
Please try again.
```

Log the technical error internally.

---

# 68. PERFORMANCE

Do not optimize prematurely.

First make it:

```text
correct
secure
understandable
```

Then optimize if needed.

---

# 69. DATABASE DESIGN PRINCIPLE

DynamoDB is not a traditional SQL database.

Do not blindly design it like MySQL.

Before creating indexes, ask:

```text
What queries does the application need?
```

Then design the table around those access patterns.

---

# 70. INITIAL DYNAMODB ACCESS PATTERNS

The system needs:

```text
Get all assignments for user
Get one assignment for user
Create assignment
Update assignment
Delete assignment
```

Therefore user ownership should be central to the key design.

---

# 71. AWS RESOURCE NAMING

Use consistent names.

Example:

```text
student-cloud-manager-dev
student-cloud-manager-prod
```

DynamoDB:

```text
student-cloud-manager-assignments-dev
student-cloud-manager-files-dev
student-cloud-manager-subjects-dev
```

S3:

```text
student-cloud-manager-files-dev
```

Lambda:

```text
student-cloud-manager-create-assignment-dev
student-cloud-manager-get-assignments-dev
```

Do not randomly name resources.

---

# 72. DEVELOPMENT ENVIRONMENTS

At minimum:

```text
dev
```

Optional later:

```text
staging
prod
```

For a college project, do not create unnecessary environments.

---

# 73. INFRASTRUCTURE DOCUMENTATION

`ARCHITECTURE.md` must explain:

1. AWS services
2. Data flow
3. Authentication flow
4. File upload flow
5. Assignment flow
6. Security model
7. Cost considerations
8. Scalability
9. Failure scenarios

---

# 74. FAILURE SCENARIOS

The documentation should explain what happens if:

### Lambda fails

API returns an error.

### DynamoDB is unavailable

Application displays a retryable error.

### S3 upload fails

File is not considered successfully uploaded.

### User loses internet

Frontend shows an appropriate error.

### Authentication expires

User is asked to authenticate again.

---

# 75. SCALABILITY STORY

The project should be able to explain:

> What happens if 10 users become 10,000 users?

Conceptually:

```text
More users
    ↓
More API requests
    ↓
Lambda scales automatically
    ↓
DynamoDB handles increased traffic
    ↓
S3 handles object storage
```

The exact limits and pricing should be verified against current AWS documentation before presenting numerical claims.

---

# 76. AVAILABILITY STORY

Managed AWS services reduce the amount of infrastructure we personally need to maintain.

We don't need to manually maintain:

```text
physical servers
operating systems
hard drives
database servers
```

This is one of the main cloud-computing lessons demonstrated by the project.

---

# 77. SECURITY STORY

Security layers:

```text
User
 ↓
Cognito Authentication
 ↓
API Authorization
 ↓
Lambda Validation
 ↓
User Ownership Check
 ↓
DynamoDB/S3
```

Never rely on just one layer.

---

# 78. PROJECT PRESENTATION STORY

The presentation should follow this narrative:

## Problem

Students keep assignments and notes in scattered places.

## Solution

A centralized cloud-based academic management platform.

## Why AWS?

AWS provides managed services for:

- authentication
- storage
- databases
- backend execution
- APIs
- monitoring

## Architecture

Show architecture diagram.

## Demo

Show actual working application.

## Security

Explain Cognito + IAM + ownership checks.

## Scalability

Explain serverless architecture.

## Cost

Explain controlled usage and removal of unnecessary resources.

---

# 79. VIVA QUESTIONS

Prepare answers for:

### What is AWS?

AWS is a cloud platform providing computing, storage, databases, networking, security, and many other managed services.

### What is S3?

S3 is object storage. We use it to store files.

### Why not store PDFs in DynamoDB?

DynamoDB is primarily for structured application data. S3 is designed for object/file storage.

### What is Lambda?

Lambda lets us run backend code without managing a continuously running server.

### What is serverless?

Serverless means the cloud provider manages the underlying servers and infrastructure for us. We still use servers underneath, but we don't manage them directly.

### What is API Gateway?

It provides an API entry point between the frontend and backend Lambda functions.

### What is DynamoDB?

A managed NoSQL database from AWS.

### What is Cognito?

AWS's authentication and identity service.

### What is IAM?

AWS Identity and Access Management. It controls permissions.

### What is CloudWatch?

AWS monitoring and logging service.

### Why S3 + DynamoDB?

S3 stores the actual file.

DynamoDB stores information ABOUT the file.

---

# 80. COMMON BAD DECISIONS TO AVOID

Do not:

- Put passwords in DynamoDB.
- Give Lambda administrator access.
- Put AWS secret keys in frontend JavaScript.
- Trust user IDs supplied by the frontend.
- Allow users to download arbitrary S3 objects.
- Store everything in one giant JSON document.
- Add 20 AWS services just to make the architecture look impressive.
- Add AI without a real reason.
- Build a complicated microservice system.
- Ignore error handling.
- Ignore cost monitoring.
- Leave unused AWS resources running.

---

# 81. CLAUDE CONTEXT UPDATE PROTOCOL

This is extremely important.

Claude must maintain project continuity.

After every substantial task, update:

```text
PROJECT_CONTEXT.md
CHANGELOG.md
TODO.md
```

when applicable.

---

# 82. CONTEXT UPDATE FORMAT

At the end of a development task, Claude should internally summarize:

```text
TASK COMPLETED:
What was changed?

FILES CHANGED:
Which files changed?

AWS CHANGES:
Which AWS resources changed?

TESTS:
What was tested?

CURRENT STATUS:
What works?

KNOWN ISSUES:
What remains broken?

NEXT STEP:
What should happen next?
```

Then update the appropriate project files.

---

# 83. CONTEXT COMPACTION RULE

If the conversation becomes very long, Claude must NOT rely only on conversation history.

Instead:

1. Read `PROJECT_CONTEXT.md`.
2. Read `TODO.md`.
3. Read latest `CHANGELOG.md`.
4. Inspect repository.
5. Continue from the recorded state.

This prevents losing project context.

---

# 84. SESSION START PROTOCOL

At the beginning of a new Claude session:

```text
1. Read CLAUDE.md.
2. Inspect git status.
3. Inspect project tree.
4. Read PROJECT_CONTEXT.md.
5. Read TODO.md.
6. Read latest CHANGELOG entries.
7. Identify current phase.
8. Identify current task.
9. Inspect relevant code.
10. Only then make changes.
```

---

# 85. SESSION END PROTOCOL

Before ending a meaningful session:

```text
1. Run tests.
2. Check git diff.
3. Remove debugging code.
4. Update PROJECT_CONTEXT.md.
5. Update CHANGELOG.md.
6. Update TODO.md.
7. Document AWS changes.
8. State remaining issues.
9. State exact next recommended task.
```

---

# 86. NEVER SAY "DONE" WITHOUT VERIFICATION

Claude must distinguish:

```text
Implemented
```

from:

```text
Verified
```

A feature is only verified if it was actually tested.

Example:

Bad:

> Authentication is done.

Better:

> Authentication implementation is complete. Registration and login were tested successfully. Invalid credentials were also tested. Logout remains to be verified.

---

# 87. TASK EXECUTION FORMAT

For significant tasks, Claude should use this reasoning structure:

```text
Goal
↓
Current State
↓
Relevant Files
↓
Implementation Plan
↓
Implementation
↓
Tests
↓
Documentation
↓
Context Update
↓
Next Step
```

Do not dump unnecessary internal reasoning to the user.

Provide concise implementation summaries.

---

# 88. CHANGE SAFETY

Before changing architecture:

Ask:

```text
Does this simplify the project?
Does this solve a real requirement?
Does this introduce unnecessary cost?
Does this introduce unnecessary complexity?
Does this break the current AWS design?
```

If yes, reconsider.

---

# 89. FEATURE PRIORITY

Priority order:

```text
P0
Correctness
Security
Authentication
Core CRUD
Data integrity

P1
UX
File handling
Validation
Monitoring

P2
Performance
Polish
Extra features

P3
Experimental features
```

---

# 90. MVP STOP RULE

Once all P0 features work:

STOP adding features temporarily.

Instead:

```text
test
secure
document
demonstrate
```

A small complete project is better than a giant unfinished project.

---

# 91. DOCUMENTATION REQUIREMENTS

README must contain:

```text
Project Overview
Features
Architecture
AWS Services
Prerequisites
Installation
Environment Variables
Local Development
AWS Setup
Deployment
Testing
Security
Cost Considerations
Screenshots
Known Limitations
Future Improvements
```

---

# 92. README QUICK START

Example:

```bash
git clone <repository>
cd student-cloud-manager

cd frontend
npm install
npm run dev
```

Do not put fake commands in documentation.

Verify commands before documenting them.

---

# 93. DEPLOYMENT DOCUMENTATION

Deployment documentation must explicitly state:

```text
1. Build frontend
2. Configure S3
3. Configure API Gateway
4. Configure Lambda
5. Configure Cognito
6. Configure DynamoDB
7. Configure environment variables
8. Configure CloudFront if used
9. Test application
```

Exact AWS Console instructions should be documented once the actual configuration exists.

Do not pretend resources exist if they have not been created.

---

# 94. SCREENSHOT REQUIREMENTS

Capture screenshots of:

```text
AWS Console
├── Cognito
├── S3
├── DynamoDB
├── Lambda
├── API Gateway
├── CloudWatch
└── IAM

Application
├── Login
├── Dashboard
├── Assignments
├── Notes
└── Subjects
```

Use screenshots in the final academic report/presentation.

Do not expose credentials or sensitive identifiers unnecessarily.

---

# 95. FINAL PROJECT REPORT STRUCTURE

Recommended:

```text
1. Introduction
2. Problem Statement
3. Objectives
4. Existing System
5. Proposed System
6. AWS Architecture
7. AWS Services Used
8. System Design
9. Database Design
10. Authentication
11. File Management
12. API Design
13. Security
14. Testing
15. Results
16. Limitations
17. Future Scope
18. Conclusion
```

---

# 96. FUTURE SCOPE

Possible future work:

- Mobile application
- Email reminders
- Calendar integration
- Professor accounts
- Assignment submission
- AI-powered note summarization
- OCR
- Search indexing
- Analytics
- Notifications

These are future ideas, not MVP requirements.

---

# 97. AWS RESOURCE CLEANUP

After testing, verify whether resources should remain.

Potential resources to inspect:

```text
S3 buckets
Lambda functions
API Gateway APIs
DynamoDB tables
Cognito user pools
CloudFront distributions
CloudWatch log groups
IAM roles
```

Never blindly delete resources.

First determine whether they are required.

---

# 98. COST-CONTROL CHECKLIST

Before final submission:

- [ ] Billing alert configured
- [ ] No unnecessary resources
- [ ] No unnecessary large files
- [ ] No test data explosion
- [ ] No expensive resources accidentally enabled
- [ ] CloudWatch logs reviewed
- [ ] Unused resources identified
- [ ] Current AWS pricing/free-tier eligibility checked

---

# 99. SECURITY CHECKLIST

Before final submission:

- [ ] No credentials committed
- [ ] `.env` ignored
- [ ] `.env.example` provided
- [ ] Cognito used for authentication
- [ ] Backend validates ownership
- [ ] IAM follows least privilege
- [ ] S3 permissions reviewed
- [ ] File size restricted
- [ ] File type restricted
- [ ] Input validation implemented
- [ ] Sensitive information excluded from logs
- [ ] CORS reviewed
- [ ] Error messages sanitized

---

# 100. FINAL ACCEPTANCE CRITERIA

The project is considered academically complete when:

## Application

- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] User can create assignment
- [ ] User can view assignments
- [ ] User can edit assignment
- [ ] User can delete assignment
- [ ] User can mark assignment complete
- [ ] User can create subjects
- [ ] User can upload files
- [ ] User can view files
- [ ] User can download files
- [ ] User can delete files
- [ ] Dashboard displays real data

## AWS

- [ ] Cognito configured
- [ ] API Gateway configured
- [ ] Lambda configured
- [ ] DynamoDB configured
- [ ] S3 configured
- [ ] IAM configured
- [ ] CloudWatch configured
- [ ] CloudFront configured if selected

## Security

- [ ] Authentication works
- [ ] Authorization works
- [ ] Users cannot access each other's data
- [ ] Secrets are protected
- [ ] IAM permissions are limited

## Quality

- [ ] Tests performed
- [ ] Errors handled
- [ ] README complete
- [ ] Architecture documented
- [ ] Changelog updated
- [ ] Project context updated
- [ ] Final screenshots captured

---

# 101. FINAL DEMO SCRIPT

The presenter should demonstrate:

```text
STEP 1
Open application.

STEP 2
Register a new student account.

STEP 3
Login.

STEP 4
Show dashboard.

STEP 5
Create:
"DBMS Assignment 3"

STEP 6
Show assignment appearing.

STEP 7
Open AWS DynamoDB.

Show that the assignment is stored.

STEP 8
Upload:
"DBMS_Unit_3.pdf"

STEP 9
Open S3.

Show that the file exists.

STEP 10
Return to application.

Download file.

STEP 11
Mark assignment complete.

STEP 12
Show updated dashboard.

STEP 13
Open CloudWatch.

Show Lambda/API logs.

STEP 14
Explain Cognito.

STEP 15
Explain IAM.

STEP 16
Explain why S3 and DynamoDB are separate.

STEP 17
Explain how serverless architecture helps scalability.

STEP 18
Explain cost-control strategy.
```

---

# 102. FINAL VIVA ARCHITECTURE EXPLANATION

The simplest explanation:

> "Our application uses a serverless AWS architecture. Amazon Cognito handles authentication, API Gateway exposes our backend APIs, AWS Lambda runs our application logic, DynamoDB stores structured metadata such as assignments and file information, and Amazon S3 stores uploaded documents. CloudWatch is used for monitoring and logging, while IAM controls permissions between AWS services."

Then explain the data flow:

```text
User
 ↓
Frontend
 ↓
Cognito
 ↓
API Gateway
 ↓
Lambda
 ↓
DynamoDB / S3
```

---

# 103. CLAUDE'S DEFAULT BEHAVIOR

When asked:

> "Build X"

Claude should:

1. Inspect the current project.
2. Determine whether X already exists.
3. Identify dependencies.
4. Make a plan.
5. Implement the smallest complete version.
6. Test it.
7. Fix failures.
8. Update documentation.
9. Update context.
10. Report exactly what changed.

---

# 104. WHEN CLAUDE SHOULD ASK FOR CONFIRMATION

Ask before:

- deleting significant data
- deleting AWS resources
- changing architecture substantially
- introducing expensive infrastructure
- changing authentication architecture
- changing database schema in a breaking way
- replacing a working implementation
- making irreversible operations

Do NOT ask for confirmation for ordinary safe coding tasks.

---

# 105. WHEN CLAUDE SHOULD JUST PROCEED

Claude should proceed without asking unnecessary questions when:

- fixing obvious bugs
- formatting code
- adding tests
- updating documentation
- implementing an already-approved requirement
- fixing lint errors
- improving error handling
- updating changelog
- updating project context

---

# 106. IMPORTANT: AVOID OVERENGINEERING

This is a student project.

The ideal architecture is:

```text
Simple
Secure
Cloud-native
Understandable
Demonstrable
Affordable
```

Not:

```text
Complicated
Enterprise-sized
Over-engineered
Expensive
Impossible to explain
```

---

# 107. CURRENT PROJECT STATUS

As of 2026-10-08 (see PROJECT_CONTEXT.md for the live state):

```text
Phase: Backend deployed to AWS (ap-south-1); CloudFront pending account verification

Frontend: Complete (React + Vite), redesigned and rebranded as "Noto"; runs locally against the live backend
Backend: Deployed (3 Lambdas); live API test 35/35
Authentication: Cognito deployed; live sign-in verified; UI sign-up with real email pending
Database: DynamoDB deployed and verified
File Storage: S3 presigned upload/download verified live
API: HTTP API + JWT authorizer deployed and verified
Monitoring: Log groups, alarms, dashboard deployed; alert email/budget not yet configured
Deployment: deploy.ps1 (-NoCloudFront until the account is verified)
Testing: 36 backend + 17 frontend unit, 30-check demo E2E, 35-check live API, all passing
Documentation: Complete; PROJECT_CONTEXT.md has the deployed resource list
```

Note: AWS SAM (infrastructure as code) was adopted early, contrary to section 37. The reasoning is
recorded in PROJECT_CONTEXT.md → Important Decisions.

---

# 108. IMMEDIATE NEXT ACTION

The local foundation, the MVP and the first AWS deployment are done (2026-10-08).

At the start of the next session:

```text
1. Read PROJECT_CONTEXT.md → "Resume Here" and "Next Task (exact)".
2. Check git: work is on branch feature/aws-deployment, not yet merged into main.
3. Check AWS access: aws sts get-caller-identity → account 956519720747.
4. Continue with the first unfinished item in "Next Task (exact)".
```

AWS resources now exist. Before changing or deleting them, follow §104 (ask first), and keep
`-NoCloudFront` on deploys until the account is verified for CloudFront.

---

# 109. PROJECT PRINCIPLE

The project should always follow this order:

```text
UNDERSTAND
    ↓
PLAN
    ↓
BUILD
    ↓
TEST
    ↓
SECURE
    ↓
DOCUMENT
    ↓
UPDATE CONTEXT
    ↓
COMMIT
```

Never:

```text
BUILD
    ↓
HOPE
    ↓
SUBMIT
```

---

# 110. END OF CLAUDE INSTRUCTIONS

This document is a living document.

If the architecture, requirements, AWS services, security model, or development workflow changes, update this file rather than allowing project knowledge to become scattered across conversations.

The goal is not merely to produce code.

The goal is to produce a **working, understandable, secure, documented AWS project that a student can confidently demonstrate and explain.**