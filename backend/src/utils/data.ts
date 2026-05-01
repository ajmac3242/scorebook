import {
  recursiveTransform,
  redactRecord,
  REDACTED_HEADERS,
} from "./security.js";
import { INTERNAL_KEYS } from "../responses.js";

/**
 * Redacts sensitive information from the Lambda event before logging.
 *
 * @param {unknown} event - The raw Lambda event.
 * @returns {unknown} A sanitized copy of the event.
 */
export function maskEvent(event: unknown): unknown {
  const ev = event as Record<string, unknown>;
  const masked: Record<string, unknown> = { ...ev };

  if (ev.headers) {
    masked.headers = redactRecord(
      ev.headers as Record<string, string>,
      REDACTED_HEADERS,
    );
  }

  const multiValueHeaders = ev.multiValueHeaders as
    | Record<string, string[]>
    | undefined;
  if (multiValueHeaders) {
    masked.multiValueHeaders = redactRecord(
      multiValueHeaders,
      REDACTED_HEADERS,
      (val) => val.map(() => "[REDACTED]"),
    );
  }

  if (ev.cookies) {
    masked.cookies = (ev.cookies as string[]).map(() => "[REDACTED]");
  }

  if (ev.queryStringParameters) {
    masked.queryStringParameters = redactRecord(
      ev.queryStringParameters as Record<string, string>,
    );
  }

  const multiValueQueryParams = ev.multiValueQueryStringParameters as
    | Record<string, string[]>
    | undefined;
  if (multiValueQueryParams) {
    masked.multiValueQueryStringParameters = redactRecord(
      multiValueQueryParams,
      undefined,
      (val) => val.map(() => "[REDACTED]"),
    );
  }

  const requestContext = masked.requestContext as
    | Record<string, unknown>
    | undefined;
  if (requestContext?.authorizer) {
    requestContext.authorizer = "[REDACTED]";
  }

  if (masked.body) {
    masked.body = "[REDACTED]";
  }

  return masked;
}

/**
 * Retrieves a header value in a case-insensitive manner.
 *
 * @param {Record<string, string | undefined> | undefined} headers - Request headers.
 * @param {string} name - Header name to find.
 * @returns {string | undefined} Header value or undefined.
 */
export function getHeader(
  headers: Record<string, string | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const key in headers) {
    if (key.toLowerCase() === target) {
      return headers[key];
    }
  }
  return undefined;
}

/**
 * Strips local-only fields and internal DynamoDB keys from the data object.
 *
 * @param {unknown} data - The data to clean.
 * @returns {unknown} The cleaned data.
 */
export function stripLocalFields(data: unknown): unknown {
  return recursiveTransform(data, (key) => {
    if (INTERNAL_KEYS.has(key)) {
      return { skip: true };
    }
    return { skip: false };
  });
}
