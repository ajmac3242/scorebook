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

## 2026-06-13 - Systemic Hardening and Input Sanitization

**Vulnerability:** Multiple systemic gaps including weak administrative key patterns, potential ReDoS in redaction utilities, and permissive prototype pollution checks at the API entry point.
**Learning:** Security is a layered defense. Relying on downstream JSON parsing for security checks is insufficient; raw body inspection and input length capping provide critical protection against specialized attacks like ReDoS or prototype pollution before they hit the application logic.
**Prevention:** Enforce strict input validation (length, control characters, path patterns) at the absolute entry point and maintain a baseline CSP to mitigate the impact of unforeseen injection vulnerabilities.
