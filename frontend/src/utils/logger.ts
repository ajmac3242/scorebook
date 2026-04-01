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
const listeners: ((log: LogEntry) => void)[] = [];

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
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    error,
    context,
  };

  // Ensure errors are serializable for the UI
  if (error instanceof Error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

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
   * @param {(log: LogEntry) => void} listener - The callback function.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe: (listener: (log: LogEntry) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};
