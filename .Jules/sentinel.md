# Sentinel Journal - Critical Security Learnings

## 2025-06-25 - Recursive Depth Guard Placement
**Vulnerability:** Inconsistent recursion depth limiting in `stripLocalFields`.
**Learning:** Moving security guards (like depth limits) below type-specific branching (e.g., `Array.isArray`) can bypass protection for those types, potentially leading to stack overflow DoS if malicious deeply nested arrays are provided.
**Prevention:** Always position recursion depth checks at the absolute entry point of recursive utilities to ensure universal enforcement.

## 2025-06-25 - Error Redaction Sequencing
**Vulnerability:** Exposure of sensitive data in serialized Error objects.
**Learning:** Redacting an `Error` instance directly often fails because properties like `message` and `stack` are non-enumerable. Redaction must occur *after* the Error is transformed into a plain serializable object to ensure the key-based scanner can identify and scrub sensitive terms.
**Prevention:** Standardize a "Serialize then Redact" pattern for all complex or non-POJO types before they reach logs or the UI.
