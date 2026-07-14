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
    "x-csrf-token",
    "x-xsrf-token",
    "cf-access-token",
    "x-real-ip",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-forwarded-for",
    "x-client-ip",
    "x-amz-date",
    "x-amz-content-sha256",
    "x-amz-user-agent",
    "x-amz-security-token",
    // 🛡️ Sentinel Enhancement 3: Expand redacted headers
    "cf-connecting-ip",
    "true-client-ip",
    "fastly-client-ip",
    "x-cluster-client-ip",
    "x-original-forwarded-for",
    "x-api-token",
    "x-access-token",
    "x-identity-token",
    "x-refresh-token",
    "x-session-id",
    "x-user-id",
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
 * Combined regex for robust redaction of sensitive terms.
 * Targets both key-value pairs (to keep the key for context) and standalone words.
 * Handles quoted values, multi-word tokens (Bearer), and JSON-like structures.
 */
const REDACT_KEY_PATTERN = Array.from(REDACTED_HEADERS).join("|");
// 🛡️ Sentinel Enhancement 7: Refine redaction regex to handle more variations and prevent bypasses
const REDACT_COMBINED_REGEX = new RegExp(
  `("?(?:${REDACT_KEY_PATTERN})["']?)([:=]\\s*|\\s+is\\s+|\\s+->\\s+|\\s+=>\\s+)(?:(["'])(.*?)\\3|((?:Bearer\\s+)\\S+|[^\\s&,;\\n\\r]+))|\\b(${REDACT_KEY_PATTERN})\\b`,
  "gi",
);

/**
 * Redacts sensitive terms and their associated values from a string.
 *
 * WHY: This implements defense-in-depth by ensuring that even if object-level
 * sanitization is bypassed or if sensitive data appears in raw strings (like
 * error messages or stack traces), it is scrubbed before reaching the logs.
 *
 * @param input - The string to redact.
 * @returns The redacted string.
 */
export function redactString(input: string): string {
  if (!input) return input;
  // 🛡️ Sentinel: Combined pass to catch both key-value pairs and standalone words.
  // To ensure absolute privacy, we redact both the key and the value for known
  // sensitive fields, preventing even the existence of certain keys from being
  // leaked in specific contexts (like stack traces).
  return input.replace(
    REDACT_COMBINED_REGEX,
    (match, key, delim, quote, quotedValue, unquotedValue, standalone) => {
      if (key) {
        // Redact the key part while preserving quotes and delimiters
        const redactedKey = key.replace(/[a-zA-Z0-9_-]+/g, "[REDACTED]");
        // Values are always fully redacted to [REDACTED], but we preserve quotes if they existed
        if (quote) {
          return `${redactedKey}${delim}${quote}[REDACTED]${quote}`;
        }
        return `${redactedKey}${delim}[REDACTED]`;
      }
      return "[REDACTED]";
    },
  );
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
    return;
  }

  const message =
    typeof error === "object"
      ? redactString(JSON.stringify(sanitizeForLog(error), null, 2))
      : redactString(String(error));

  console.error(`[ERROR] ${label}:`, message);
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
      typeof data === "object"
        ? redactString(JSON.stringify(sanitizeForLog(data)))
        : redactString(String(data)),
    );
  } else {
    console.info(`[INFO] ${label}`);
  }
}

/**
 * Helper to redact sensitive keys in a map (Record).
 * @param map - The map to redact.
 * @param redactAll - Whether to redact all keys regardless of name.
 * @param depth - Current recursion depth.
 * @returns A redacted copy of the map.
 */
function redactMap(
  map: Record<string, unknown> | undefined,
  redactAll = false,
  depth = 0,
): Record<string, unknown> | undefined {
  if (!map) return undefined;
  if (depth > 10) return { "[DEPTH_LIMIT]": "[REDACTED]" };

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(map)) {
    const shouldRedact = redactAll || REDACTED_HEADERS.has(key.toLowerCase());

    if (shouldRedact) {
      redacted[key] = Array.isArray(value)
        ? value.map(() => "[REDACTED]")
        : "[REDACTED]";
      continue;
    }

    if (value !== null && typeof value === "object") {
      redacted[key] = Array.isArray(value)
        ? value.map((item) =>
            typeof item === "object" && item !== null
              ? redactMap(item as Record<string, unknown>, redactAll, depth + 1)
              : item,
          )
        : redactMap(value as Record<string, unknown>, redactAll, depth + 1);
    } else {
      redacted[key] = value;
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
  const masked: Record<string, unknown> = { ...event };

  const redactTargets = [
    { key: "headers", redactAll: false },
    { key: "multiValueHeaders", redactAll: false },
    { key: "queryStringParameters", redactAll: true },
    { key: "multiValueQueryStringParameters", redactAll: true },
  ] as const;

  for (const { key, redactAll } of redactTargets) {
    const val = masked[key];
    if (val) {
      masked[key] = redactMap(val as Record<string, unknown>, redactAll);
    }
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
  }

  const requestContext = masked.requestContext as Record<string, unknown>;
  if (requestContext?.authorizer) {
    requestContext.authorizer = "[REDACTED]";
  }

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
  const raw = event as unknown as Record<string, unknown>;
  const method =
    event.requestContext?.http?.method ?? raw.method ?? raw.httpMethod ?? "GET";
  return { method: method as string, path: normalizePath(event) };
}

/**
 * Timing-safe string comparison to prevent timing attacks on sensitive keys.
 * Enforces maximum length and strict type checking to prevent ReDoS or DoS.
 *
 * @param {string} a - First string (e.g., user-provided key).
 * @param {string} b - Second string (e.g., actual secret key).
 * @returns {boolean} True if strings are equal.
 */
export function safeCompare(a: string, b: string): boolean {
  // 🛡️ Sentinel Enhancement 8: Strict type and length checks
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length > 1024 || b.length > 1024) return false;

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
  // 🛡️ Sentinel Enhancement 4: Harden path extraction against traversal and metacharacters
  if (
    id.length > 128 ||
    /[\/\s\0\r\n\x00-\x1F\`\$\(\)\{\}\[\]\*\|\>\<\&\;\#\?\\\@\~]/.test(id)
  ) {
    return null;
  }
  return id;
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
export const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>([
    "__proto__",
    "constructor",
    "prototype",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__",
  ]),
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
    return Array.isArray(data) ? [] : {};
  }

  // 🛡️ Sentinel: Block prototype pollution attempts via nested objects
  if (Array.isArray(data)) {
    return data.map((item) => stripLocalFields(item, depth + 1));
  }

  // ⚡ Bolt: Use for...of with Object.entries() for clarity.
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (!INTERNAL_KEYS.has(key) && !FORBIDDEN_KEYS.has(key)) {
      result[key] = stripLocalFields(value, depth + 1);
    }
  }
  return result;
}
