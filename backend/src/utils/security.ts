import crypto from "node:crypto";

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
export const FORBIDDEN_KEYS = Object.freeze(
  new Set<string>(["__proto__", "constructor", "prototype"]),
);

/**
 * Redacts values in a record if their keys match a sensitive set.
 *
 * @param record - The record to redact.
 * @param sensitiveKeys - Keys whose values should be redacted.
 * @param redactor - Function to apply to matched values.
 * @returns A new record with sensitive values redacted.
 */
export function redactRecord<T>(
  record: Record<string, T>,
  sensitiveKeys?: ReadonlySet<string>,
  redactor: (val: T) => unknown = () => "[REDACTED]",
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...record };
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      if (!sensitiveKeys || sensitiveKeys.has(key.toLowerCase())) {
        result[key] = redactor(result[key] as T);
      }
    }
  }
  return result;
}

const REDACTION_PATTERN = Array.from(REDACTED_HEADERS)
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
export const REDACTION_REGEX = new RegExp(`(${REDACTION_PATTERN})`, "gi");

/**
 * Performs a timing-safe comparison of two strings.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns True if both strings are equal.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Recursively transforms the keys and values of a nested object.
 *
 * @param data - The data to transform.
 * @param transform - Callback invoked for each key/value pair.
 * @param depth - Current recursion depth (used internally).
 * @returns The transformed data.
 */
export function recursiveTransform(
  data: unknown,
  transform: (
    key: string,
    value: unknown,
  ) => { skip: boolean; value?: unknown },
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
