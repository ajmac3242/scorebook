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
export const REDACTED_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "proxy-authorization",
  "x-amz-security-token",
]);

/**
 * Standardized error logger for the backend.
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object.
 */
export function logError(label: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[ERROR] ${label}: ${error.message}`, error.stack);
  } else {
    console.error(
      `[ERROR] ${label}:`,
      typeof error === "object" ? JSON.stringify(error, null, 2) : error,
    );
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
  // ⚡ Bolt: Return original reference early if no sensitive data structures exist.
  if (!event.headers && !event.cookies) return event;

  let hasRedactable = false;
  if (event.headers) {
    // ⚡ Bolt: Use Object.keys().some() for faster sensitive header detection.
    hasRedactable = Object.keys(event.headers).some((k) =>
      REDACTED_HEADERS.has(k.toLowerCase()),
    );
  }

  if (!hasRedactable && (!event.cookies || event.cookies.length === 0))
    return event;

  const masked = { ...event };
  if (event.headers) {
    const redactedHeaders = { ...masked.headers };
    for (const key in redactedHeaders) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedHeaders[key] = "[REDACTED]";
      }
    }
    masked.headers = redactedHeaders;
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
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
 * Strips local-only fields and internal DynamoDB keys from the data object before saving.
 *
 * @param {Record<string, unknown>} data - The data object to clean.
 * @param {number} depth - Current recursion depth.
 * @returns {Record<string, unknown>} The cleaned object.
 */
export function stripLocalFields(
  data: unknown,
  depth = 0,
): Record<string, unknown> {
  if (!data || typeof data !== "object" || data === null || depth > 10) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const key in data as Record<string, unknown>) {
    if (
      Object.prototype.hasOwnProperty.call(data, key) &&
      !INTERNAL_KEYS.has(key)
    ) {
      const value = (data as Record<string, unknown>)[key];
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        result[key] = stripLocalFields(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
