## 2025-05-15 - [Mass Assignment and Information Leakage]
**Vulnerability:** The backend Lambda was vulnerable to mass assignment because it spread the request body *after* assigning internal primary and index keys (`PK`, `SK`, etc.), allowing clients to overwrite these critical fields. Additionally, the main handler was returning raw error messages to the client, potentially leaking system internals.
**Learning:** Even when using a `stripLocalFields` helper, the order of object spreading is critical. Spreading user-provided data last creates a "last-one-wins" vulnerability.
**Prevention:** Always spread user-provided data *before* setting internal metadata or keys, and ensure the sanitization helper is exhaustive for all internal-only fields.

## 2026-04-04 - [Ghost Item Creation on Conditional Updates]
**Vulnerability:** The backend was vulnerable to "ghost item" creation where `UpdateCommand` calls for soft deletes, restores, or status changes would create a new, mostly empty item if the targeted record did not already exist.
**Learning:** DynamoDB's `UpdateItem` (and `UpdateCommand`) defaults to an "upsert" behavior unless a `ConditionExpression` is explicitly provided.
**Prevention:** Always include `ConditionExpression: "attribute_exists(PK)"` (or another existence check) for any `UpdateCommand` that is intended to modify an existing resource rather than creating one.
