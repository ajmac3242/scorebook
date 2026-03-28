## 2025-05-15 - Security Enhancements and Information Disclosure Fix

**Vulnerability:** Sensitive Cognito session tokens (ID, Access, and Refresh tokens) were leaked to the browser console during the login process via `console.log`. Additionally, the backend was only redacting the `Authorization` header, potentially leaving other sensitive headers like `Cookie` or `X-Api-Key` exposed in CloudWatch logs.

**Learning:** Debug logs left in production code are a common source of sensitive information disclosure. In a single-table DynamoDB design, allowing the delimiter character (`#`) in user-provided IDs can lead to "key injection" attacks where a malicious user could potentially craft an ID that allows them to access or modify data belonging to other entities.

**Prevention:**
1. Always remove or use a production-safe logger for authentication flows to ensure tokens are never logged.
2. Implement a centralized `maskEvent` helper on the backend that redacts a broad set of sensitive headers (`Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`).
3. Strictly validate all user-provided IDs and URLs. For IDs, ensure they do not contain internal delimiters like `#`. For URLs, enforce safe protocols (`http`, `https`) to prevent `javascript:`-based XSS.
