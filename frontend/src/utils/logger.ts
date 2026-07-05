/**
 * @file logger.ts
 * @description Standardized error logger for the application.
 * Captures and stores recent logs in memory for debugging and display in UI.
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: unknown;
  context?: unknown;
}

const MAX_LOGS = 50;
let logs: LogEntry[] = [];
const listeners: ((_log: LogEntry) => void)[] = [];

/**
 * Set of sensitive keys to redact from logs.
 */
const SENSITIVE_KEYS = new Set([
  "authorization",
  "token",
  "password",
  "secret",
  "api-key",
  "api key",
  "apiKey",
  "access_token",
  "id_token",
  "refresh_token",
  "x-api-token",
  "x-access-token",
  "x-identity-token",
  "x-refresh-token",
  "x-session-id",
  "x-user-id",
]);

/**
 * Pre-compiled combined regex for redaction.
 * Handles both standalone sensitive words and key-value pairs (quoted/unquoted).
 */
const REDACT_KEY_PATTERN = Array.from(SENSITIVE_KEYS)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const REDACT_COMBINED_REGEX = new RegExp(
  `("?(?:${REDACT_KEY_PATTERN})["']?)([:=]\\s*|\\s+is\\s+|\\s+->\\s+|\\s+=>\\s+)(?:(["'])(.*?)\\3|((?:Bearer\\s+)\\S+|[^\\s&,;]+))|\\b(${REDACT_KEY_PATTERN})\\b`,
  "gi",
);

/**
 * Redacts sensitive information from an object or string.
 *
 * WHY: This utility prevents accidental leakage of sensitive information (passwords, tokens)
 * into frontend logs, which might be persisted or displayed in UI. It uses a robust
 * regex to catch both standalone words and common key-value patterns.
 *
 * @param data - The data to sanitize.
 * @param depth - Current recursion depth.
 * @returns A sanitized copy.
 */
function redact(data: unknown, depth = 0): unknown {
  if (depth > 10) return "[DEPTH_LIMIT]";

  if (typeof data === "string") {
    return data.replace(
      REDACT_COMBINED_REGEX,
      (match, key, delim, quote, _quotedValue, _unquotedValue, _standalone) => {
        if (key) {
          const redactedKey = key.replace(/[a-zA-Z0-9_-]+/g, "[REDACTED]");
          if (quote) {
            return `${redactedKey}${delim}${quote}[REDACTED]${quote}`;
          }
          return `${redactedKey}${delim}[REDACTED]`;
        }
        return "[REDACTED]";
      },
    );
  }

  if (data === null || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => redact(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = redact(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Appends a log entry to the in-memory log storage and notifies listeners.
 * @param {LogLevel} level - Log level.
 * @param {string} message - Log message.
 * @param {unknown} [error] - Error object.
 * @param {unknown} [context] - Contextual data.
 */
const addLog = (
  level: LogLevel,
  message: string,
  error?: unknown,
  context?: unknown,
) => {
  // Ensure errors are serializable for the UI
  let processedError = error;
  if (error instanceof Error) {
    const errorObj: Record<string, unknown> = {};
    Object.getOwnPropertyNames(error).forEach((key) => {
      errorObj[key] = (error as unknown as Record<string, unknown>)[key];
    });
    processedError = errorObj;
  }

  // 🛡️ Sentinel: Redact sensitive info before storage
  const sanitizedMessage = redact(message) as string;
  const sanitizedContext = redact(context);
  const sanitizedError = redact(processedError);

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: sanitizedMessage,
    error: sanitizedError,
    context: sanitizedContext,
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  listeners.forEach((listener) => listener(entry));
};

/**
 * Standardized error logger for the application.
 */
export const logger = {
  error: (message: string, error?: unknown, context?: unknown) => {
    console.error(`[ERROR] ${message}`, error, context);
    addLog("error", message, error, context);
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
    addLog("warn", message, undefined, context);
  },
  info: (message: string, context?: unknown) => {
    console.info(`[INFO] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
    addLog("info", message, undefined, context);
  },

  /**
   * Retrieves all stored logs.
   * @returns {LogEntry[]} The list of logs.
   */
  getLogs: () => [...logs],

  /**
   * Clears the in-memory log storage.
   */
  clearLogs: () => {
    logs = [];
  },

  /**
   * Subscribes to new log entries.
   * @param {(_log: LogEntry) => void} listener - The callback function.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe: (listener: (_log: LogEntry) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};
