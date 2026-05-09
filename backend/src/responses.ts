/**
 * @file responses.ts
 * @description Standardized HTTP response helpers and security headers for the Basketball Stats API.
 */

import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

/**
 * Internal keys to redact from outgoing data.
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
 * Redacts internal metadata keys from outgoing data for API responses and S3 snapshots.
 * Recursively cleans objects and arrays while preserving the 'id' field for frontend consumption.
 *
 * WHY: This is a critical security layer that prevents leaking infrastructure
 * implementation details (specifically DynamoDB Partition and Sort Key structures)
 * to the client. Hiding internal keys (PK, SK, GSI) reduces the attack surface by
 * not exposing the underlying database schema and prevents clients from relying
 * on internal metadata that might change.
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
    // Optimization: Pre-allocate array if size is known.
    const len = data.length;
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = sanitizeOutput(data[i], depth + 1);
    }
    return result;
  }

  // ⚡ Bolt: Use Object.entries() for faster object iteration in modern engines.
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (key === "id" || !INTERNAL_KEYS.has(key)) {
      sanitized[key] = sanitizeOutput(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Filters out soft-deleted items from a list.
 *
 * @param {T[]} items - The list of items to filter.
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
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response object.
 */
export function response(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control":
        "private, no-cache, no-store, max-age=0, must-revalidate",
      "Surrogate-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Content-Security-Policy":
        "default-src 'none'; frame-ancestors 'none'; sandbox; base-uri 'none'; form-action 'none';",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
      "X-XSS-Protection": "0",
      "X-Permitted-Cross-Domain-Policies": "none",
      "X-DNS-Prefetch-Control": "off",
      "X-Download-Options": "noopen",
      "Origin-Agent-Cluster": "?1",
    },
    body: JSON.stringify(sanitizeOutput(body)),
  };
}

/**
 * Semantic response helpers.
 * @param {unknown} body - The response body.
 * @returns {APIGatewayProxyStructuredResultV2} The formatted response.
 */
export const ok = (body: unknown) => response(200, body);
export const created = (body: unknown) => response(201, body);
export const badRequest = (msg: string) => response(400, { message: msg });
export const notFound = (msg: string) => response(404, { message: msg });
export const serverError = () =>
  response(500, { message: "Internal Server Error" });
