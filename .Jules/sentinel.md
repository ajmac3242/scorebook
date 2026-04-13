## 2025-05-15 - [Mass Assignment and Information Leakage]
**Vulnerability:** The backend Lambda was vulnerable to mass assignment because it spread the request body *after* assigning internal primary and index keys (`PK`, `SK`, etc.), allowing clients to overwrite these critical fields. Additionally, the main handler was returning raw error messages to the client, potentially leaking system internals.
**Learning:** Even when using a `stripLocalFields` helper, the order of object spreading is critical. Spreading user-provided data last creates a "last-one-wins" vulnerability.
**Prevention:** Always spread user-provided data *before* setting internal metadata or keys, and ensure the sanitization helper is exhaustive for all internal-only fields.

## 2026-04-04 - [Ghost Item Creation on Conditional Updates]
**Vulnerability:** The backend was vulnerable to "ghost item" creation where `UpdateCommand` calls for soft deletes, restores, or status changes would create a new, mostly empty item if the targeted record did not already exist.
**Learning:** DynamoDB's `UpdateItem` (and `UpdateCommand`) defaults to an "upsert" behavior unless a `ConditionExpression` is explicitly provided.
**Prevention:** Always include `ConditionExpression: "attribute_exists(PK)"` (or another existence check) for any `UpdateCommand` that is intended to modify an existing resource rather than creating one.

## 2026-04-10 - [Unprotected Admin Endpoints and Missing Security Headers]
**Vulnerability:** The `/cleanup` administrative endpoint was entirely unauthenticated, allowing arbitrary clients to trigger destructive data cleanup processes. Additionally, the API lacked fundamental security headers (CSP, HSTS, X-Frame-Options), leaving it vulnerable to common web-based attacks and information leakage via logs.
**Learning:** Defense-in-depth requires securing even "internal" or "utility" endpoints and ensuring all responses communicate security constraints to the browser. Case-insensitive header redaction is critical for preventing credential leakage in multi-client environments.
**Prevention:** Always implement authentication/authorization for destructive endpoints using secure secrets (e.g., API keys in ENV). Centralize response generation to include mandatory security headers and use exhaustive, case-insensitive log masking for all potentially sensitive headers.

## 2026-04-12 - [Path Traversal via Unvalidated Resource IDs]
**Vulnerability:** Resource identifiers (Team IDs, Player IDs, etc.) were accepted from clients as arbitrary strings and used directly to construct S3 keys for data snapshots (e.g., `teams/${id}/roster.json`). This allowed path traversal attacks where a malicious ID like `../../../secret` could target unintended S3 locations.
**Learning:** Even when using UUIDs on the frontend, the backend must never trust client-provided identifiers used in file system or object storage paths.
**Prevention:** Enforce strict UUID v4 format validation on all client-provided IDs at the API entry point. Centralize this validation to ensure consistency across all handlers. Additionally, use no-store cache headers for sensitive JSON responses to prevent data leakage in shared environments.
