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
export const REDACTED_HEADERS = new Set<string>([
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
]);

/**
 * Standardized error logger for the backend.
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object.
 */
/**
 * Redacts sensitive fields from an object before logging.
 * @param obj - The object to sanitize.
 * @returns A sanitized copy of the object.
 */
function sanitizeForLog(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key in sanitized) {
    if (REDACTED_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 *
 * @param label
 * @param error
 */
export function logError(label: string, error: unknown) {
  // 🛡️ Enhancement 10: Sanitize all error logs to prevent secret leakage
  if (error instanceof Error) {
    let message = error.message;
    let stack = error.stack || "";
    // Simple string-based redaction for the most common sensitive patterns
    REDACTED_HEADERS.forEach((term) => {
      const regex = new RegExp(term, "gi");
      if (message.toLowerCase().includes(term)) {
        message = message.replace(regex, "[REDACTED]");
      }
      if (stack.toLowerCase().includes(term)) {
        stack = stack.replace(regex, "[REDACTED]");
      }
    });
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
 * WHY: This is a security-critical function that prevents JWT tokens and other
 * secrets (like the "Authorization" header) from being leaked into CloudWatch logs.
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
  const anyEvent = event as any;
  if (anyEvent.multiValueHeaders) {
    const redactedMulti = { ...anyEvent.multiValueHeaders };
    for (const key in redactedMulti) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedMulti[key] = redactedMulti[key].map(() => "[REDACTED]");
      }
    }
    (masked as any).multiValueHeaders = redactedMulti;
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

  if (anyEvent.multiValueQueryStringParameters) {
    const redactedMultiParams = { ...anyEvent.multiValueQueryStringParameters };
    for (const key in redactedMultiParams) {
      redactedMultiParams[key] = redactedMultiParams[key].map(
        () => "[REDACTED]",
      );
    }
    (masked as any).multiValueQueryStringParameters = redactedMultiParams;
  }

  // Redact authorizer context which may contain JWT claims or internal IDs
  if ((masked.requestContext as any)?.authorizer) {
    (masked.requestContext as any).authorizer = "[REDACTED]";
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

  let path = raw;
  if (path.startsWith("/$default")) path = path.slice(9);
  else if (path.startsWith("/api")) path = path.slice(4);

  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  return path || "/";
}

/**
 * Extracts HTTP method and path from various event formats.
 * @param {APIGatewayProxyEventV2} event - Lambda event.
 * @returns {{method: string, path: string}} Normalized metadata.
 */
export function extractRequestMetadata(event: APIGatewayProxyEventV2) {
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
 * WHY: This provides mass assignment protection and prevents UI-only state or
 * internal database keys from being persisted. It ensures that only valid,
 * schema-defined fields are saved to DynamoDB.
 *
 * @param {Record<string, unknown>} data - The data object to clean.
 * @param {number} depth - Current recursion depth.
 * @returns {Record<string, unknown>} The cleaned object.
 */
/**
 * Set of keys that are forbidden to prevent prototype pollution.
 */
const FORBIDDEN_KEYS = new Set<string>([
  "__proto__",
  "constructor",
  "prototype",
]);

/**
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * WHY: This provides mass assignment protection and prevents UI-only state or
 * internal database keys from being persisted. It ensures that only valid,
 * schema-defined fields are saved to DynamoDB. It also protects against
 * prototype pollution and recursively cleans arrays.
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

  const result: Record<string, unknown> = {};
  const obj = data as Record<string, unknown>;

  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      !INTERNAL_KEYS.has(key) &&
      !FORBIDDEN_KEYS.has(key)
    ) {
      result[key] = stripLocalFields(obj[key], depth + 1);
    }
  }
  return result;
}
