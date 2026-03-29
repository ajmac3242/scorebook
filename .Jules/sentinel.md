## 2025-05-15 - [Mass Assignment and Information Leakage]
**Vulnerability:** The backend Lambda was vulnerable to mass assignment because it spread the request body *after* assigning internal primary and index keys (`PK`, `SK`, etc.), allowing clients to overwrite these critical fields. Additionally, the main handler was returning raw error messages to the client, potentially leaking system internals.
**Learning:** Even when using a `stripLocalFields` helper, the order of object spreading is critical. Spreading user-provided data last creates a "last-one-wins" vulnerability.
**Prevention:** Always spread user-provided data *before* setting internal metadata or keys, and ensure the sanitization helper is exhaustive for all internal-only fields.
