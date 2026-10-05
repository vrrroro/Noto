# API Reference

Base URL: the `ApiUrl` stack output, e.g. `https://abc123.execute-api.ap-south-1.amazonaws.com`

## Conventions

**Authentication:** every route requires a Cognito **access token**:

```http
Authorization: Bearer <access token>
```

Requests without a valid token are rejected by API Gateway with `401` before any code runs.
The user's identity is the token's `sub` claim. A `userId` sent in a body is ignored.

**Response envelope:**

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "code": "ASSIGNMENT_NOT_FOUND", "message": "Assignment not found." } }
```

**Status codes:** `200` OK · `201` Created · `400` invalid input · `401` not signed in · `404` not
found (also returned for other users' records) · `409` conflict · `500` internal error (generic message).

**Common error codes:** `VALIDATION_ERROR`, `INVALID_JSON`, `UNAUTHORIZED`, `ROUTE_NOT_FOUND`,
`INTERNAL_ERROR`.

---

## Assignments

### `GET /assignments`

Lists the caller's assignments, sorted by due date, then priority (high first), then creation time.

```json
{
  "success": true,
  "data": [
    {
      "assignmentId": "6f1c…",
      "title": "DBMS Assignment 3",
      "description": "Normalization problems",
      "subject": "DBMS",
      "dueDate": "2026-10-15",
      "priority": "HIGH",
      "completed": false,
      "createdAt": "2026-10-06T10:00:00.000Z",
      "updatedAt": "2026-10-06T10:00:00.000Z"
    }
  ]
}
```

### `GET /assignments/{id}`

Returns one assignment. `404 ASSIGNMENT_NOT_FOUND` if it doesn't exist or isn't yours.

### `POST /assignments` → `201`

| Field | Rules |
| --- | --- |
| `title` | required, 1–150 chars (trimmed) |
| `description` | optional, ≤ 2000 chars |
| `subject` | required, must match one of your subjects (case-insensitive; stored with the subject's spelling) |
| `dueDate` | required, real calendar date `YYYY-MM-DD` |
| `priority` | optional `LOW` / `MEDIUM` / `HIGH` (default `MEDIUM`) |

```json
{ "title": "DBMS Assignment", "description": "Complete normalization questions", "subject": "DBMS", "dueDate": "2026-10-15", "priority": "HIGH" }
```

Errors: `400 VALIDATION_ERROR` (e.g. `{"title": ""}` or `{"dueDate": "banana"}`), `400 SUBJECT_NOT_FOUND`.

### `PUT /assignments/{id}`

Partial update. Send any of `title`, `description`, `subject`, `dueDate`, `priority`, `completed` (boolean).

```json
{ "completed": true }
```

Returns the updated assignment. Errors: `400 VALIDATION_ERROR` (including "No valid fields to update."),
`400 SUBJECT_NOT_FOUND`, `404 ASSIGNMENT_NOT_FOUND`.

### `DELETE /assignments/{id}`

```json
{ "success": true, "data": { "assignmentId": "6f1c…" }, "message": "Assignment deleted." }
```

Errors: `404 ASSIGNMENT_NOT_FOUND`.

---

## Subjects

### `GET /subjects`

```json
{ "success": true, "data": [ { "subjectId": "a1…", "name": "DBMS", "createdAt": "2026-10-06T10:00:00.000Z" } ] }
```

Sorted alphabetically (case-insensitive).

### `POST /subjects` → `201`

```json
{ "name": "Cloud Computing" }
```

`name`: required, 1–60 chars. Errors: `400 VALIDATION_ERROR`, `409 SUBJECT_EXISTS` (case-insensitive duplicate).

### `DELETE /subjects/{id}`

Errors: `404 SUBJECT_NOT_FOUND`, `409 SUBJECT_IN_USE` (the subject still has assignments or uploaded
files; the message includes the counts).

---

## Files

File objects:

```json
{
  "fileId": "9d2…",
  "fileName": "DBMS_Unit_3.pdf",
  "subject": "DBMS",
  "s3Key": "users/<sub>/files/9d2…/DBMS_Unit_3.pdf",
  "contentType": "application/pdf",
  "fileSize": 1258291,
  "status": "UPLOADED",
  "createdAt": "2026-10-06T10:00:00.000Z",
  "uploadedAt": "2026-10-06T10:00:03.000Z"
}
```

### `GET /files`

Lists the caller's **uploaded** files (pending uploads are hidden), newest first.

### `POST /files` → `201` (step 1 of upload)

```json
{ "fileName": "DBMS_Unit_3.pdf", "fileSize": 1258291, "subject": "DBMS" }
```

| Field | Rules |
| --- | --- |
| `fileName` | required; path stripped, unusual characters replaced, ≤ 150 chars; extension must be one of `pdf doc docx ppt pptx txt png jpg jpeg` |
| `fileSize` | required positive integer, ≤ 10 485 760 bytes (10 MB) |
| `subject` | required, must be one of your subjects |

Response:

```json
{
  "success": true,
  "data": {
    "file": { "fileId": "9d2…", "status": "PENDING", "…": "…" },
    "upload": {
      "url": "https://<files-bucket>.s3.<region>.amazonaws.com/",
      "fields": { "key": "users/…/DBMS_Unit_3.pdf", "Content-Type": "application/pdf", "Policy": "…", "X-Amz-Signature": "…" },
      "expiresIn": 300
    }
  }
}
```

Errors: `400 VALIDATION_ERROR`, `400 UNSUPPORTED_FILE_TYPE`, `400 FILE_TOO_LARGE`, `400 SUBJECT_NOT_FOUND`.

**Step 2:** the browser sends `multipart/form-data` to `upload.url` with every entry from
`upload.fields` followed by the `file` field (it must come last). S3 itself rejects wrong sizes,
content types and keys, and rejects requests after 5 minutes.

### `POST /files/{id}/complete` (step 3 of upload)

Checks that the object exists in S3 and marks the file `UPLOADED` with its real size. The call is
idempotent. Errors: `404 FILE_NOT_FOUND`, `409 UPLOAD_INCOMPLETE` (nothing uploaded yet),
`400 FILE_TOO_LARGE` (the object is deleted).

### `GET /files/{id}/download`

```json
{ "success": true, "data": { "url": "https://…X-Amz-Expires=300…", "fileName": "DBMS_Unit_3.pdf", "expiresIn": 300 } }
```

The URL forces `Content-Disposition: attachment`. Errors: `404 FILE_NOT_FOUND`.

### `DELETE /files/{id}`

Deletes the S3 object and then the metadata.
`{"success": true, "data": {"fileId": "…"}, "message": "File deleted."}`. Errors: `404 FILE_NOT_FOUND`.

---

## Trying it with curl

```bash
# Get a token (USER_PASSWORD_AUTH is enabled on the app client)
TOKEN=$(aws cognito-idp initiate-auth --client-id <UserPoolClientId> \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=you@example.com,PASSWORD='YourPassw0rd' \
  --query 'AuthenticationResult.AccessToken' --output text)

curl -H "Authorization: Bearer $TOKEN" "$API_URL/assignments"
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"DBMS"}' "$API_URL/subjects"
```
