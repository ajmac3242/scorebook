/**
 * Standardized error logger for the application.
 * Currently logs to console, but can be extended to an external service.
 */
export const logger = {
  error: (message: string, error?: unknown, context?: unknown) => {
    console.error(`[ERROR] ${message}`, error, context);
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  },
  info: (message: string, context?: unknown) => {
    console.info(`[INFO] ${message}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  },
};
