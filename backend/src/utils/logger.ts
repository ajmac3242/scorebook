/**
 * @file logger.ts
 * @description Standardized logger for the backend.
 * Provides a consistent interface for logging information, warnings, and errors.
 */

export type LogLevel = "info" | "warn" | "error";

/**
 * Standardized logger for the backend.
 */
export const logger = {
  /**
   * Logs an error message.
   * @param {string} message - The error message.
   * @param {unknown} [error] - The error object.
   * @param {unknown} [context] - Additional context.
   */
  error: (message: string, error?: unknown, context?: unknown) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}: ${error.message}`, error.toString(), context);
    } else {
      console.error(`[ERROR] ${message}`, error, context);
    }
  },

  /**
   * Logs a warning message.
   * @param {string} message - The warning message.
   * @param {unknown} [context] - Additional context.
   */
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, context);
  },

  /**
   * Logs an informational message.
   * @param {string} message - The message.
   * @param {unknown} [context] - Additional context.
   */
  info: (message: string, context?: unknown) => {
    if (context && typeof context === "object") {
      console.info(`[INFO] ${message}`, JSON.stringify(context));
    } else {
      console.info(`[INFO] ${message}`, context);
    }
  },
};
