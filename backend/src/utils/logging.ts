import { REDACTED_HEADERS, REDACTION_REGEX, recursiveTransform } from "./security.js";

/**
 * Redacts sensitive fields from an object before logging.
 *
 * @param {unknown} obj - The object to sanitize.
 * @returns {unknown} A sanitized copy of the object.
 */
export function sanitizeForLog(obj: unknown): unknown {
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
  if (error instanceof Error) {
    let message = error.message;
    let stack = error.stack || "";
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
