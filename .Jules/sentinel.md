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

## 2026-04-16 - [Unintentional Resource Overwrites and Log Token Leakage]
**Vulnerability:** The backend utilized `PutCommand` for resource creation (Teams, Players, Stats) without existence checks, allowing clients to overwrite existing data if they guessed or reused a UUID. Additionally, while some headers were redacted, the `cookies` array and several proxy-related headers remained visible in CloudWatch logs, potentially leaking session identifiers.
**Learning:** In DynamoDB, `PutItem` is an upsert by default. Secure resource creation requires an explicit `attribute_not_exists(PK)` condition. For log security, redacting headers is insufficient if the same sensitive data (like cookies) is also present in other event fields.
**Prevention:** Implement a centralized `putNewItem` helper that enforces the `attribute_not_exists(PK)` condition for all creation events. Exhaustively redact both `headers` and `cookies` fields in the Lambda event before logging.

## 2026-04-18 - [Recursive Mass Assignment and Deep-Recursion DoS]
**Vulnerability:** While shallow internal keys were stripped, the backend was still vulnerable to mass assignment if sensitive keys (like `PK` or `SK`) were nested within objects in the request body. Additionally, recursive sanitization logic lacked depth limits, creating a potential stack-overflow Denial-of-Service (DoS) vector.
**Learning:** Security utilities must be as robust as the data they process. Recursive cleaning is necessary for complex JSON structures, but it must be bound by safe execution limits.
**Prevention:** Implement a recursive `stripLocalFields` for all incoming data and enforce a maximum recursion depth (e.g., 10) in both input stripping and output sanitization to prevent DoS. Use strict type checks (like `Number.isInteger`) to prevent unexpected data types from bypassing business logic.

## 2026-04-20 - [Log Leakage and Missing Defense-in-Depth Protections]
**Vulnerability:** The application leaked potentially sensitive data (query parameters and authorizer context) into CloudWatch logs and lacked standard defensive layers like HTTP method whitelisting, request body size limits, and advanced security headers (Surrogate-Control, DNS-Prefetch-Control). Error logs also risked leaking secrets via `Error.message` and `Error.stack`.
**Learning:** Log redaction must be exhaustive across all event fields and error objects to be effective. Relying solely on header redaction leaves gaps in query strings and authorizer metadata. Defense-in-depth requires multiple layers of protection at the handler entry point.
**Prevention:** Implement centralized, exhaustive log masking for all event fields and recursively sanitize all error logs (including messages and stack traces). Enforce strict whitelists for HTTP methods and upper bounds for payload sizes to mitigate DoS and injection risks.
