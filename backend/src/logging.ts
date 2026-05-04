import { APIGatewayProxyEventV2 } from "aws-lambda";

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
  ]),
);

/**
 * Redacts sensitive fields from an object before logging.
 *
 * WHY: This utility prevents accidental leakage of sensitive information into
 * CloudWatch logs. It recursively scans objects and redacts any keys that match
 * the REDACTED_HEADERS set. A recursion limit is enforced to prevent stack
 * overflow Denial-of-Service (DoS) attacks from malicious, deeply nested payloads.
 *
 * @param {unknown} obj - The object to sanitize.
 * @param {number} depth - Current recursion depth.
 * @returns {unknown} A sanitized copy of the object.
 */
function sanitizeForLog(obj: unknown, depth = 0): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (depth > 10) return "[DEPTH_LIMIT_REACHED]";

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLog(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLog(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Standardized error logger for the backend with log sanitization.
 * @param {string} label - Contextual label for the error.
 * @param {unknown} error - The error object to be logged.
 * @returns {void}
 */
export function logError(label: string, error: unknown) {
  if (error instanceof Error) {
    let message = error.message;
    let stack = error.stack || "";
    // Simple string-based redaction for the most common sensitive patterns
    REDACTED_HEADERS.forEach((term) => {
      const regex = new RegExp(term, "gi");
      if (message.toLowerCase().includes(term)) {
        message = message.replace(regex, "[REDACTED]");
      }
      if (stack.toLowerCase().includes(term)) {
        stack = stack.replace(regex, "[REDACTED]");
      }
    });
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
 * @param {unknown} data - The data to log.
 * @returns {void}
 */
export function logInfo(label: string, data?: unknown) {
  if (data !== undefined) {
    console.info(
      `[INFO] ${label}:`,
      typeof data === "object" ? JSON.stringify(data) : data,
    );
  } else {
    console.info(`[INFO] ${label}`);
  }
}

/**
 * Redacts sensitive information from the Lambda event before logging.
 *
 * WHY: CloudWatch logs are often accessible to multiple developers or automated tools.
 * Masking sensitive headers (Authorization, Cookies), query parameters, and request
 * bodies prevents accidental leakage of PII or credentials that could be used for
 * unauthorized access or replay attacks.
 *
 * @param {APIGatewayProxyEventV2} event - The raw Lambda event.
 * @returns {unknown} A sanitized copy of the event.
 */
export function maskEvent(event: APIGatewayProxyEventV2): unknown {
  const masked = { ...event };

  if (event.headers) {
    const redactedHeaders: Record<string, string | undefined> = {
      ...masked.headers,
    };
    for (const key in redactedHeaders) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedHeaders[key] = "[REDACTED]";
      }
    }
    masked.headers = redactedHeaders;
  }

  // Handle multi-value headers if present (older API Gateway versions)
  const anyEvent = event as unknown as Record<string, unknown>;
  const multiValueHeaders = anyEvent.multiValueHeaders as Record<
    string,
    string[]
  >;
  if (multiValueHeaders) {
    const redactedMulti = { ...multiValueHeaders };
    for (const key in redactedMulti) {
      if (REDACTED_HEADERS.has(key.toLowerCase())) {
        redactedMulti[key] = redactedMulti[key].map(() => "[REDACTED]");
      }
    }
    (masked as unknown as Record<string, unknown>).multiValueHeaders =
      redactedMulti;
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
  }

  // Redact all query string parameters as they often contain tokens or PII
  if (event.queryStringParameters) {
    const redactedParams = { ...event.queryStringParameters };
    for (const key in redactedParams) {
      redactedParams[key] = "[REDACTED]";
    }
    masked.queryStringParameters = redactedParams;
  }

  const multiValueQueryParams = anyEvent.multiValueQueryStringParameters as
    | Record<string, string[]>
    | undefined;
  if (multiValueQueryParams) {
    const redactedMultiParams = { ...multiValueQueryParams };
    for (const key in redactedMultiParams) {
      redactedMultiParams[key] = redactedMultiParams[key].map(
        () => "[REDACTED]",
      );
    }
    (
      masked as unknown as Record<string, unknown>
    ).multiValueQueryStringParameters = redactedMultiParams;
  }

  // Redact authorizer context which may contain JWT claims or internal IDs
  const requestContext = masked.requestContext as unknown as Record<
    string,
    unknown
  >;
  if (requestContext?.authorizer) {
    requestContext.authorizer = "[REDACTED]";
  }

  if (masked.body) {
    masked.body = "[REDACTED]";
  }

  return masked;
}
