/**
 * @file responses.ts
 * @description Standardized HTTP response helpers and security headers for the Basketball Stats API.
 */

import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

/**
 * Internal keys to redact from outgoing data to prevent leaking database schema.
 */
export const INTERNAL_KEYS = Object.freeze(
  new Set<string>([
    "synced",
    "PK",
    "SK",
    "GSI1PK",
    "GSI1SK",
    "GSI2PK",
    "GSI2SK",
    "deletedAt",
    "isArchived",
  ]),
);

/**
 * Set of keys that are forbidden to prevent prototype pollution in outgoing data.
 */
const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>(["__proto__", "constructor", "prototype"]),
);

/**
 * Redacts internal metadata keys from outgoing data for API responses and S3 snapshots.
 * Recursively cleans objects and arrays while preserving the 'id' field for frontend consumption.
 *
 * WHY: This is a critical security layer that prevents leaking infrastructure
 * implementation details (specifically DynamoDB Partition and Sort Key structures)
 * to the client. Hiding internal keys (PK, SK, GSI) reduces the attack surface by
 * not exposing the underlying database schema and prevents clients from relying
 * on internal metadata that might change.
 *
 * SECURITY BOUNDARY: This function ensures that even if the backend logic accidentally
 * includes internal fields in its response objects, they are stripped before
 * the data leaves the trusted environment. This implements defense-in-depth by
 * separating internal data structures from external API contracts.
 *
 * @param {unknown} data - The data object or array to sanitize.
 * @param {number} depth - Current recursion depth.
 * @returns {unknown} The sanitized data.
 */
export function sanitizeOutput(data: unknown, depth = 0): unknown {
  // ⚡ Bolt: Fast-path for primitives (90% of recursive calls).
  if (data === null || typeof data !== "object") {
    return data;
  }

  if (depth > 10) {
    return {};
  }

  if (Array.isArray(data)) {
    // 🛡️ Enhancement: Array Size Limit for DoS Protection
    // WHY: Limiting the size of arrays processed recursively prevents memory
    // exhaustion and potential DoS attacks from maliciously crafted large payloads.
    const len = Math.min(data.length, 1000);
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = sanitizeOutput(data[i], depth + 1);
    }
    return result;
  }

  // ⚡ Bolt: Use Object.entries() for faster object iteration in modern engines.
  const sanitized: Record<string, unknown> = {};
  const entries = Object.entries(data as Record<string, unknown>);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    // 🛡️ Enhancement: Added prototype pollution protection by checking against FORBIDDEN_KEYS
    if ((key === "id" || !INTERNAL_KEYS.has(key)) && !FORBIDDEN_KEYS.has(key)) {
      sanitized[key] = sanitizeOutput(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Filters out soft-deleted items from a list.
 *
 * @param {T[] | undefined | null} items - The list of items to filter.
 * @returns {T[]} The filtered list containing only active (non-deleted) items.
 */
export function filterActive<T extends { deletedAt?: string | null }>(
  items: T[] | undefined | null,
): T[] {
  if (!items) return [];
  return items.filter((i) => !i.deletedAt);
}

/**
 * Formats a standardized JSON response with defense-in-depth security headers.
 *
 * WHY: Centralizing response generation ensures that critical security headers
 * are applied consistently to all outgoing API responses. This implements
 * defense-in-depth by instructing the browser to enable strict security
 * protections (e.g., CSP, HSTS, COOP, CORP). Critical headers are applied
 * *after* any custom headers to prevent accidental or malicious overrides.
 *
 * @param {number} statusCode - The HTTP status code.
 * @param {unknown} body - The JSON body data.
 * @param {Record<string, string>} [headers] - Optional additional headers.
 * @param {string} [requestId] - Optional AWS Request ID for traceability.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response object.
 */
export function response(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
  requestId?: string,
): APIGatewayProxyStructuredResultV2 {
  const responseHeaders: Record<string, string> = {
    ...headers,
    "Content-Type": "application/json",
    "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
    "Surrogate-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Content-Security-Policy":
      "default-src 'none'; object-src 'none'; script-src 'none'; frame-ancestors 'none'; sandbox; base-uri 'none'; form-action 'none'; upgrade-insecure-requests;",
    "X-Content-Security-Policy":
      "default-src 'none'; object-src 'none'; script-src 'none'; frame-ancestors 'none'; sandbox; base-uri 'none'; form-action 'none'; upgrade-insecure-requests;",
    "X-WebKit-CSP":
      "default-src 'none'; object-src 'none'; script-src 'none'; frame-ancestors 'none'; sandbox; base-uri 'none'; form-action 'none'; upgrade-insecure-requests;",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=(), usb=(), bluetooth=(), hid=(), serial=(), idle-detection=(), keyboard-map=(), screen-wake-lock=()",
    "X-XSS-Protection": "0",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "Origin-Agent-Cluster": "?1",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (requestId) {
    responseHeaders["X-Request-Id"] = requestId;
    responseHeaders["Access-Control-Expose-Headers"] = "X-Request-Id";
  }

  return {
    statusCode,
    headers: responseHeaders,
    body: JSON.stringify(sanitizeOutput(body)),
  };
}

/**
 * Semantic response helpers.
 */

/**
 * Returns a 200 OK response.
 * @param {unknown} body - The response body.
 * @param {string} [requestId] - Optional AWS Request ID.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const ok = (
  body: unknown,
  requestId?: string,
): APIGatewayProxyStructuredResultV2 => response(200, body, {}, requestId);

/**
 * Returns a 201 Created response.
 * @param {unknown} body - The response body.
 * @param {string} [requestId] - Optional AWS Request ID.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const created = (
  body: unknown,
  requestId?: string,
): APIGatewayProxyStructuredResultV2 => response(201, body, {}, requestId);

/**
 * Returns a 400 Bad Request response.
 * @param {string} msg - The error message.
 * @param {string} [requestId] - Optional AWS Request ID.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const badRequest = (
  msg: string,
  requestId?: string,
): APIGatewayProxyStructuredResultV2 =>
  response(400, { message: msg }, {}, requestId);

/**
 * Returns a 404 Not Found response.
 * @param {string} msg - The error message.
 * @param {string} [requestId] - Optional AWS Request ID.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const notFound = (
  msg: string,
  requestId?: string,
): APIGatewayProxyStructuredResultV2 =>
  response(404, { message: msg }, {}, requestId);

/**
 * Returns a 500 Internal Server Error response.
 * @param {string} [requestId] - Optional AWS Request ID.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const serverError = (
  requestId?: string,
): APIGatewayProxyStructuredResultV2 =>
  response(500, { message: "Internal Server Error" }, {}, requestId);
