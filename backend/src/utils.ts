/**
 * @file utils.ts
 * @description Utility and security helper functions for the Basketball Stats API.
 */

import { APIGatewayProxyEventV2 } from "aws-lambda";
import crypto from "node:crypto";
import { INTERNAL_KEYS } from "./responses.js";
/**
 * Pre-compiled regex for path normalization.
 */
const PATH_PREFIX_REGEX = /^\/(\$default|api)/;
const TRAILING_SLASH_REGEX = /\/+$/;

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
  ]),
);

/**
 * Redacts sensitive fields from an object before logging.
 *
 * WHY: This utility prevents accidental leakage of sensitive information into
 * CloudWatch logs. It recursively scans objects and redacts any keys that match
 * the REDACTED_HEADERS set. A recursion limit is enforced to prevent stack
 * overflow Denial-of-Service (DoS) attacks from malicious, deeply nested payloads.
 *
 * @param obj - The object to sanitize.
 * @param depth - Current recursion depth.
 * @returns A sanitized copy of the object.
 */
function sanitizeForLog(obj: unknown, depth = 0): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > 10) return "[DEPTH_LIMIT_REACHED]";

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLog(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Redacts sensitive terms from a string.
 * @param input - The string to redact.
 * @returns The redacted string.
 */
function redactString(input: string): string {
  let result = input;
  REDACTED_HEADERS.forEach((term) => {
    const regex = new RegExp(term, "gi");
    result = result.replace(regex, "[REDACTED]");
  });
  return result;
}

/**
 * Standardized error logger for the backend with log sanitization.
 * @param label - Contextual label for the error.
 * @param error - The error object or data to be logged.
 */
export function logError(label: string, error: unknown) {
  // 🛡️ Enhancement 10: Sanitize all error logs to prevent secret leakage
  if (error instanceof Error) {
    const message = redactString(error.message);
    const stack = redactString(error.stack || "");
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
 * @returns {void}
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
 * Helper to redact sensitive keys in a map (Record).
 * @param map - The map to redact.
 * @param redactAll - Whether to redact all keys regardless of name.
 * @returns A redacted copy of the map.
 */
function redactMap(
  map: Record<string, unknown> | undefined,
  redactAll = false,
): Record<string, unknown> | undefined {
  if (!map) return undefined;
  const redacted = { ...map };
  for (const key in redacted) {
    if (redactAll || REDACTED_HEADERS.has(key.toLowerCase())) {
      const val = redacted[key];
      redacted[key] = Array.isArray(val)
        ? val.map(() => "[REDACTED]")
        : "[REDACTED]";
    }
  }
  return redacted;
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
  const anyEvent = event as unknown as Record<string, unknown>;

  // Consolidate redaction for headers, query params and their multi-value variants
  const redactTargets: Array<{ key: string; redactAll?: boolean }> = [
    { key: "headers" },
    { key: "multiValueHeaders" },
    { key: "queryStringParameters", redactAll: true },
    { key: "multiValueQueryStringParameters", redactAll: true },
  ];

  for (const { key, redactAll } of redactTargets) {
    const val = anyEvent[key];
    if (val) {
      (masked as Record<string, unknown>)[key] = redactMap(
        val as Record<string, unknown>,
        redactAll,
      );
    }
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
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
  const path = raw
    .replace(PATH_PREFIX_REGEX, "")
    .replace(TRAILING_SLASH_REGEX, "");

  return path || "/";
}

/**
 * Extracts HTTP method and path from various event formats.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {{method: string, path: string}} Normalized metadata.
 */
export function extractRequestMetadata(event: APIGatewayProxyEventV2) {
  const method =
    event.requestContext?.http?.method ||
    (event as unknown as Record<string, unknown>).method ||
    (event as unknown as Record<string, unknown>).httpMethod ||
    "GET";
  return { method: method as string, path: normalizePath(event) };
}

/**
 * Timing-safe string comparison to prevent timing attacks on sensitive keys.
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
 * @param headers - Request headers.
 * @param name - Header name to find.
 * @returns Header value or undefined.
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
 * Set of keys that are forbidden to prevent prototype pollution.
 */
const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>(["__proto__", "constructor", "prototype"]),
);

/**
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * WHY: This provides mass assignment protection by ensuring that internal database
 * fields (like PK/SK) or temporary UI state cannot be injected into the database.
 * It is a critical security layer that enforces schema integrity at the application level.
 * It also protects against prototype pollution and recursively cleans arrays.
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
