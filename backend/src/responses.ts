/**
 * @file responses.ts
 * @description Standardized HTTP response helpers and security headers for the Basketball Stats API.
 */

import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

/**
 * Internal keys to redact from outgoing data.
 */
export const INTERNAL_KEYS = new Set([
  "synced",
  "PK",
  "SK",
  "GSI1PK",
  "GSI1SK",
  "GSI2PK",
  "GSI2SK",
]);

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
 * @returns {unknown} The sanitized data.
 */
export function sanitizeOutput(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput);
  }
  if (data !== null && typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const key in data as Record<string, unknown>) {
      if (
        Object.prototype.hasOwnProperty.call(data, key) &&
        (!INTERNAL_KEYS.has(key) || key === "id")
      ) {
        sanitized[key] = sanitizeOutput((data as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Formats a standardized JSON response with defense-in-depth security headers.
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
      "Content-Type": "application/json",
      "Cache-Control":
        "private, no-cache, no-store, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Strict-Transport-Security":
        "max-age=31536000; includeSubDomains; preload",
      "Content-Security-Policy":
        "default-src 'none'; frame-ancestors 'none'; sandbox",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "interest-cohort=()",
      "X-XSS-Protection": "0",
      "X-Permitted-Cross-Domain-Policies": "none",
      ...headers,
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
export const conflict = (msg: string) => response(409, { message: msg });
export const serverError = () =>
  response(500, { message: "Internal Server Error" });
