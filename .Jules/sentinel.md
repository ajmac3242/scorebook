# Sentinel Journal - Critical Security Learnings

## 2025-06-25 - Recursive Depth Guard Placement

**Vulnerability:** Inconsistent recursion depth limiting in `stripLocalFields`.
**Learning:** Moving security guards (like depth limits) below type-specific branching (e.g., `Array.isArray`) can bypass protection for those types, potentially leading to stack overflow DoS if malicious deeply nested arrays are provided.
**Prevention:** Always position recursion depth checks at the absolute entry point of recursive utilities to ensure universal enforcement.

## 2025-06-25 - Error Redaction Sequencing

**Vulnerability:** Exposure of sensitive data in serialized Error objects.
**Learning:** Redacting an `Error` instance directly often fails because properties like `message` and `stack` are non-enumerable. Redaction must occur _after_ the Error is transformed into a plain serializable object to ensure the key-based scanner can identify and scrub sensitive terms.
**Prevention:** Standardize a "Serialize then Redact" pattern for all complex or non-POJO types before they reach logs or the UI.

## 2026-06-07 - Robust Redaction for Information Leaks

**Vulnerability:** Redaction logic was failing to catch multi-word sensitive values (like "Bearer" tokens) and quoted secrets with spaces in log strings. It also missed standalone sensitive words in plain text messages on the frontend.
**Learning:** Simple word-based or naive regex-based redaction is insufficient for logs. Tokens often contain spaces or special prefixes, and sensitive data can appear in natural language messages. Regex must account for common key-value patterns (e.g., "key: value", "key=value", "key is value") and various quoting styles.
**Prevention:** Implement a unified, robust redaction utility that handles quoted values, common delimiters, and multi-word tokens. Ensure both log messages and metadata are passed through this utility before storage or output.

## 2026-07-19 - Cognito Error Sanitization and Log Injection Escaping

**Vulnerability:** Raw Cognito error message leakage in login frontend and potential log injection/log forgery in serverless logs.
**Learning:** Returning raw Cognito exceptions directly to client interfaces risks disclosing user existence details or internal user pool parameters, enabling enumeration attacks. In serverless backends, users can inject raw carriage return (`\r`) and line feed (`\n`) characters in raw headers (e.g., user-agent) or other fields that bypass JSON serialization or appear in plaintext logs, allowing log forgery. Escaping control characters (`\r`, `\n`, `\0`) globally in the log redaction filter prevents this risk.
**Prevention:** Always map cloud-identity platform errors to a localized safe UI vocabulary. Always escape newline control characters in redaction filters before sending raw strings to console outputs.

## 2026-08-09 - Browser Console Information Disclosure via Unredacted Logger Outputs

**Vulnerability:** Information leakage of sensitive credentials, JWT access/refresh tokens, and PII to the browser developer console.
**Learning:** Developers often rely on central logs redacting memory storage (e.g. inside a telemetry/database sync workflow) but forget that the raw inputs passed directly to standard browser output channels (e.g., `console.error`, `console.warn`, `console.info`) remain fully exposed. Moreover, lookup sets for casing checks (such as checking lowercased keys) will fail if the set elements are not strictly lowercased (e.g., `"apiKey"` vs `"apikey"`), leading to silent redaction bypasses.
**Prevention:** Intercept all standard console prints inside application wrappers, map all lookup keys to strict lowercase within the sanitization sets, and copy/POJO-serialize `Error` objects to ensure non-enumerable stack and message keys are scrubbed before printing.
