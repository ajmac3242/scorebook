/**
 * @file utils.ts
 * @description Exporting utilities from modular files.
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
    "x-amz-date",
    "x-amz-content-sha256",
    "origin",
    "referer",
    "user-agent",
  ]),
);

/**
 * Set of keys that are forbidden to prevent prototype pollution.
 */
const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>(["__proto__", "constructor", "prototype"]),
);

/**
 * Redacts values in a record if their keys match a sensitive set.
 * If sensitiveKeys is not provided, all keys are redacted.
 *
 * @param record - The record to redact.
 * @param sensitiveKeys - Optional set of keys to redact (case-insensitive).
 * @param redactor - Optional custom redaction function.
 * @returns {Record<string, unknown>} The redacted record.
 */
function redactRecord<T, R = unknown>(
  record: Record<string, T>,
  sensitiveKeys?: ReadonlySet<string>,
  redactor: (val: T) => R = () => "[REDACTED]" as unknown as R,
): Record<string, T | R> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      !sensitiveKeys || sensitiveKeys.has(key.toLowerCase())
        ? redactor(value)
        : value,
    ]),
  );
}

/**
 * Core recursive object transformation logic for security sanitization.
 *
 * @param data - The data to transform.
 * @param transform - Callback to transform or skip a specific key/value.
 * @param depth - Current recursion depth.
 * @returns {unknown} The transformed data.
 */
function recursiveTransform(
  data: unknown,
  transform: (key: string, value: unknown) => { skip: boolean; value?: unknown },
  depth = 0,
): unknown {
  if (data === null || typeof data !== "object") return data;
  if (depth > 10) return Array.isArray(data) ? [] : {};

  if (Array.isArray(data)) {
    return data
      .slice(0, 1000)
      .map((item) => recursiveTransform(item, transform, depth + 1));
  }

  const result: Record<string, unknown> = {};
  const record = data as Record<string, unknown>;
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      if (FORBIDDEN_KEYS.has(key)) continue;

      const { skip, value } = transform(key, record[key]);
      if (!skip) {
        result[key] = recursiveTransform(
          value !== undefined ? value : record[key],
          transform,
          depth + 1,
        );
      }
    }
  }
  return result;
}

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
 * @returns {unknown} A sanitized copy of the object.
 */
function sanitizeForLog(obj: unknown): unknown {
  return recursiveTransform(obj, (key) => {
    if (REDACTED_HEADERS.has(key.toLowerCase())) {
      return { skip: false, value: "[REDACTED]" };
    }
    return { skip: false };
  });
}

/**
 * Standardized error logger for the backend with log sanitization.
 *
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object to be logged.
 * @returns {void}
 */
export function logError(label: string, error: unknown): void {
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
 * @param {unknown} [data] - The data to log.
 * @returns {void}
 */
export function logInfo(label: string, data?: unknown) {
  if (data !== undefined) {
    console.info(
      `[INFO] ${label}:`,
      typeof data === "object" ? JSON.stringify(sanitizeForLog(data)) : data,
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
  const masked: Record<string, unknown> = { ...event };

  if (event.headers) {
    masked.headers = redactRecord(event.headers, REDACTED_HEADERS, () =>
      "[REDACTED]",
    );
  }

  // Handle multi-value headers if present (older API Gateway versions)
  const multiValueHeaders = (event as any).multiValueHeaders;
  if (multiValueHeaders) {
    masked.multiValueHeaders = redactRecord(
      multiValueHeaders,
      REDACTED_HEADERS,
      (val: string[]) => val.map(() => "[REDACTED]"),
    );
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
  }

  // Redact all query string parameters as they often contain tokens or PII
  if (event.queryStringParameters) {
    masked.queryStringParameters = redactRecord(event.queryStringParameters);
  }

  const multiValueQueryParams = (event as any).multiValueQueryStringParameters;
  if (multiValueQueryParams) {
    masked.multiValueQueryStringParameters = redactRecord(
      multiValueQueryParams,
      undefined,
      (val: string[]) => val.map(() => "[REDACTED]"),
    );
  }

  // Redact authorizer context which may contain JWT claims or internal IDs
  const context = (masked.requestContext as any) || {};
  if (context.authorizer) {
    context.authorizer = "[REDACTED]";
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
  const raw =
    event.rawPath ||
    (event as any).path ||
    event.requestContext?.http?.path ||
    "/";

  // ⚡ Bolt: Consolidated path normalization and security checks.
  try {
    const path = decodeURIComponent(raw as string)
      .replace(/^\/(\$default|api)/, "")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "");

    // 🛡️ Enhancement: Block Path Traversal (.. or encoded %2e%2e)
    if (path.includes("..") || path.includes("%2e%2e")) return "/";

    return path || "/";
  } catch {
    return "/";
  }
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
 * Timing-safe string comparison to prevent timing attacks.
 *
 * WHY: Standard string comparison (===) often short-circuits as soon as a
 * mismatch is found, meaning it takes slightly less time to return 'false' if
 * the mismatch is at the beginning of the string. An attacker can use this
 * timing difference to guess a secret character-by-character.
 *
 * METHODOLOGY: Both inputs are hashed to a fixed length (SHA-256, 32 bytes)
 * before comparison. This is necessary because 'crypto.timingSafeEqual'
 * requires both buffers to have the exact same length to avoid leaking
 * length information via execution time.
 *
 * SECURITY CONSTRAINT: Using a fixed-length hash (SHA-256) is critical because
 * timingSafeEqual throws an error if buffer lengths differ. If we compared raw
 * strings, an attacker could determine the secret's length by observing
 * whether the server returns a 500 (length mismatch error) or a 401 (mismatch).
 *
 * @param a - User-provided key.
 * @param b - Actual secret key.
 * @returns {boolean} True if the keys match.
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
  const key = Object.keys(headers).find((k) => k.toLowerCase() === target);
  return key ? headers[key] : undefined;
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
 * SECURITY CONSTRAINT: This function is the primary defense against internal state
 * corruption. Any new internal-only fields added to the database schema MUST be
 * added to the INTERNAL_KEYS set to ensure they are stripped here.
 *
 * @param {unknown} data - The data to clean.
 * @param {number} depth - Current recursion depth.
 * @returns {unknown} The cleaned data.
 */
/**
 * Strips local-only fields and internal DynamoDB keys from the data object.
 *
 * @param {unknown} data - The data to clean.
 * @returns {unknown} The cleaned data.
 */
export function stripLocalFields(data: unknown): unknown {
  return recursiveTransform(data, (key) => {
    if (INTERNAL_KEYS.has(key)) {
      return { skip: true };
    }
    return { skip: false };
  });
}
export * from "./utils/security.js";
export * from "./utils/logging.js";
export * from "./utils/data.js";
