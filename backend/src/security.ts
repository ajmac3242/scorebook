import crypto from "node:crypto";
import { INTERNAL_KEYS } from "./responses.js";

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
  if (!data || typeof data !== "object") {
    return data;
  }

  if (depth > 10) {
    return {};
  }

  if (Array.isArray(data)) {
    const len = data.length;
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = stripLocalFields(data[i], depth + 1);
    }
    return result;
  }

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

/**
 * Timing-safe string comparison to prevent timing attacks on sensitive keys.
 *
 * WHY: Standard string comparison (`==` or `===`) can leak information about
 * the secret key because it returns as soon as it finds a mismatching character.
 * This helper uses SHA-256 hashes and timing-safe comparison to ensure the
 * execution time is independent of the input values.
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
