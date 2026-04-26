/**
 * @file utils.ts
 * @description Utility and security helper functions for the Basketball Stats API.
 */

import { APIGatewayProxyEventV2 } from "aws-lambda";
import crypto from "node:crypto";
import { INTERNAL_KEYS } from "./responses.js";

/**
 * Set of headers that should be redacted from logs for security.
 */
export const REDACTED_HEADERS = Object.freeze(
  new Set<string>([
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "proxy-authorization",
    "x-amz-security-token",
    "x-auth-token",
    "session-id",
    "api-key",
    "secret",
    "password",
    "token",
    "access-token",
    "refresh-token",
    "id-token",
    "csrf-token",
    "xsrf-token",
    "x-csrf-token",
    "x-xsrf-token",
    "bearer",
    "client-secret",
    "otp",
    "x-session-token",
    "x-api-token",
    "x-access-key",
    "x-secret-key",
    "apikey",
    "secretkey",
    "auth-token",
    "credentials",
    "private-key",
    "passphrase",
    "signature",
    "proxy-authenticate",
    "www-authenticate",
  ]),
);

/**
 * Set of keys that are forbidden to prevent prototype pollution.
 */
const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>(["__proto__", "constructor", "prototype"]),
);

/**
 * Pre-compiled regex for redacting sensitive terms from logs.
 *
 * WHY: Re-creating regex objects or iterating over headers in every log call
 * is expensive. Compiling this once at module load time improves performance
 * of error logging, especially in high-throughput or error-heavy scenarios.
 */
const REDACTION_PATTERN = Array.from(REDACTED_HEADERS)
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const REDACTION_REGEX = new RegExp(`(${REDACTION_PATTERN})`, "gi");

/**
 * Redacts sensitive fields from an object before logging.
 *
 * WHY: This utility prevents accidental leakage of sensitive information into
 * CloudWatch logs. It recursively scans objects and redacts any keys that match
 * the REDACTED_HEADERS set. A recursion limit is enforced to prevent stack
 * overflow Denial-of-Service (DoS) attacks from malicious, deeply nested payloads.
 *
 * @param {unknown} obj - The object to sanitize.
 * @param {number} depth - Current recursion depth.
 * @returns {unknown} A sanitized copy of the object.
 */
function sanitizeForLog(obj: unknown, depth = 0): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > 10) return "[DEPTH_LIMIT_REACHED]";

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // 🛡️ Enhancement: Prevent prototype pollution in logs
    if (FORBIDDEN_KEYS.has(key)) continue;

    if (REDACTED_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLog(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Standardized error logger for the backend with log sanitization.
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object to be logged.
 */
export function logError(label: string, error: unknown) {
  // 🛡️ Enhancement 10: Sanitize all error logs to prevent secret leakage
  if (error instanceof Error) {
    let message = error.message;
    let stack = error.stack || "";
    // ⚡ Bolt: Use pre-compiled regex for efficient, single-pass redaction.
    // WHY: Replacing a loop of regex creations with a single global regex
    // significantly reduces CPU overhead and garbage collection pressure
    // during error handling.
    message = message.replace(REDACTION_REGEX, "[REDACTED]");
    stack = stack.replace(REDACTION_REGEX, "[REDACTED]");
    console.error(`[ERROR] ${label}: ${message}`, stack);
  } else {
    console.error(
      `[ERROR] ${label}:`,
      typeof error === "object"
        ? JSON.stringify(sanitizeForLog(error), null, 2)
        : error,
    );
  }
}

/**
 * Standardized info logger for the backend.
 * @param {string} label - Contextual label for the message.
 * @param {unknown} data - The data to log.
 */
export function logInfo(label: string, data?: unknown) {
  if (data !== undefined) {
    console.info(
      `[INFO] ${label}:`,
      typeof data === "object" ? JSON.stringify(data) : data,
    );
  } else {
    console.info(`[INFO] ${label}`);
  }
}

/**
 * Redacts sensitive information from the Lambda event before logging.
 *
 * WHY: CloudWatch logs are often accessible to multiple developers or automated tools.
 * Masking sensitive headers (Authorization, Cookies), query parameters, and request
 * bodies prevents accidental leakage of PII or credentials that could be used for
 * unauthorized access or replay attacks.
 *
 * @param {APIGatewayProxyEventV2} event - The raw Lambda event.
 * @returns {unknown} A sanitized copy of the event.
 */
export function maskEvent(event: APIGatewayProxyEventV2): unknown {
  // 🛡️ Enhancement 1-3: Broadened log masking for headers, query params, and authorizer.
  const masked = { ...event };

  if (event.headers) {
    const redactedHeaders: Record<string, string | undefined> = {
      ...masked.headers,
    };
    for (const key in redactedHeaders) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedHeaders[key] = "[REDACTED]";
      }
    }
    masked.headers = redactedHeaders;
  }

  // Handle multi-value headers if present (older API Gateway versions)
  const anyEvent = event as unknown as Record<string, unknown>;
  const multiValueHeaders = anyEvent.multiValueHeaders as Record<
    string,
    string[]
  >;
  if (multiValueHeaders) {
    const redactedMulti = { ...multiValueHeaders };
    for (const key in redactedMulti) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedMulti[key] = redactedMulti[key].map(() => "[REDACTED]");
      }
    }
    (masked as unknown as Record<string, unknown>).multiValueHeaders =
      redactedMulti;
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
  }

  // Redact all query string parameters as they often contain tokens or PII
  if (event.queryStringParameters) {
    const redactedParams = { ...event.queryStringParameters };
    for (const key in redactedParams) {
      redactedParams[key] = "[REDACTED]";
    }
    masked.queryStringParameters = redactedParams;
  }

  const multiValueQueryParams = anyEvent.multiValueQueryStringParameters as
    | Record<string, string[]>
    | undefined;
  if (multiValueQueryParams) {
    const redactedMultiParams = { ...multiValueQueryParams };
    for (const key in redactedMultiParams) {
      redactedMultiParams[key] = redactedMultiParams[key].map(
        () => "[REDACTED]",
      );
    }
    (
      masked as unknown as Record<string, unknown>
    ).multiValueQueryStringParameters = redactedMultiParams;
  }

  // Redact authorizer context which may contain JWT claims or internal IDs
  const requestContext = masked.requestContext as unknown as Record<
    string,
    unknown
  >;
  if (requestContext?.authorizer) {
    requestContext.authorizer = "[REDACTED]";
  }

  // 🛡️ Enhancement 11: Redact body in logs to prevent sensitive data leakage and log bloating
  if (masked.body) {
    masked.body = "[REDACTED]";
  }

  return masked;
}

/**
 * Normalizes the request path by removing stage and prefix information.
 *
 * @param {APIGatewayProxyEventV2} event - The API Gateway event.
 * @returns {string} The normalized path.
 */
export function normalizePath(event: APIGatewayProxyEventV2): string {
  const raw = (event.rawPath ||
    (event as unknown as Record<string, unknown>).path ||
    event.requestContext?.http?.path ||
    "/") as string;

  // ⚡ Bolt: Use regex for cleaner prefix and trailing slash normalization.
  let path = raw.replace(/^\/(\$default|api)/, "");

  // 🛡️ Enhancement: Path Traversal Protection
  // WHY: Removing '..' sequences prevents attackers from attempting to
  // navigate out of the intended API path structure via URL manipulation.
  while (path.includes("..")) {
    path = path
      .replace(/\.\.\//g, "")
      .replace(/\/\.\./g, "")
      .replace(/\.\./g, "");
  }

  // ⚡ Bolt: Cleanup multiple forward slashes and trailing slash.
  path = path.replace(/\/+/g, "/");
  if (path.length > 1) {
    path = path.replace(/\/$/, "");
  }

  return path || "/";
}

/**
 * Extracts HTTP method and path from various event formats.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {{method: string, path: string}} Normalized metadata.
 */
export function extractRequestMetadata(event: APIGatewayProxyEventV2): {
  method: string;
  path: string;
} {
  const method =
    (event as unknown as Record<string, unknown>).method ||
    (event as unknown as Record<string, unknown>).httpMethod ||
    event.requestContext?.http?.method ||
    "GET";
  return { method: method as string, path: normalizePath(event) };
}

/**
 * Timing-safe string comparison to prevent timing attacks on sensitive keys.
 *
 * WHY: Standard string comparison (===) often short-circuits as soon as a
 * mismatch is found, meaning it takes slightly less time to return 'false' if
 * the mismatch is at the beginning of the string. An attacker can use this
 * timing difference to guess a secret character-by-character.
 *
 * MECHANICS:
 * This function uses 'crypto.timingSafeEqual' on fixed-length SHA-256 hashes
 * of the inputs. This is necessary because 'timingSafeEqual' requires both
 * inputs to have the same length. By hashing the inputs first, we ensure:
 * 1. Both inputs to the comparison are exactly 32 bytes (SHA-256 length).
 * 2. The comparison takes constant time regardless of the original input lengths
 *    or how much of the secret matches, mitigating timing-based side-channels.
 *
 * @param {string} a - First string (e.g., user-provided key).
 * @param {string} b - Second string (e.g., actual secret key).
 * @returns {boolean} True if strings are equal.
 */
export function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Extracts an ID from a path given a prefix.
 * @param {string} path - The request path.
 * @param {string} prefix - The path prefix (e.g. "/players/").
 * @returns {string | null} The extracted ID or null.
 */
export function extractIdFromPath(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const id = path.slice(prefix.length);
  return id.includes("/") ? null : id;
}

/**
 * Retrieves a header value in a case-insensitive manner.
 * @param {Record<string, string | undefined> | undefined} headers - Request headers.
 * @param {string} name - Header name to find.
 * @returns {string | undefined} Header value or undefined.
 */
export function getHeader(
  headers: Record<string, string | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const key in headers) {
    if (key.toLowerCase() === target) {
      return headers[key];
    }
  }
  return undefined;
}

/**
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * WHY: This utility serves as a critical security layer for "Mass Assignment Protection".
 * By filtering out internal DynamoDB keys (PK, SK, GSIs) and UI-only state (synced, deletedAt),
 * it ensures that a malicious client cannot inject or overwrite metadata that should
 * only be managed by the server.
 *
 * SECURITY:
 * - Prototype Pollution: Explicitly skips forbidden keys like '__proto__' to
 *   prevent malicious payloads from modifying the object prototype.
 * - Recursion Depth: Enforces a maximum depth (10) to mitigate stack overflow
 *   Denial-of-Service (DoS) attacks from deeply nested JSON structures.
 *
 * @param {unknown} data - The data to clean.
 * @param {number} depth - Current recursion depth.
 * @returns {unknown} The cleaned data.
 */
export function stripLocalFields(data: unknown, depth = 0): unknown {
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (depth > 10) {
    return {};
  }

  if (Array.isArray(data)) {
    return data.map((item) => stripLocalFields(item, depth + 1));
  }

  // ⚡ Bolt: Use Object.entries() for faster object iteration in modern engines.
  const result: Record<string, unknown> = {};
  const entries = Object.entries(data as Record<string, unknown>);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (!INTERNAL_KEYS.has(key) && !FORBIDDEN_KEYS.has(key)) {
      result[key] = stripLocalFields(value, depth + 1);
    }
  }
  return result;
}
