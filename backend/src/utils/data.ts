import { APIGatewayProxyEventV2 } from "aws-lambda";
import { INTERNAL_KEYS } from "../responses.js";
import { recursiveTransform, redactRecord, REDACTED_HEADERS } from "./security.js";

/**
 * Normalizes the request path by removing stage and prefix information.
 */
export function normalizePath(event: APIGatewayProxyEventV2): string {
  const raw = (event.rawPath ||
    (event as unknown as Record<string, unknown>).path ||
    event.requestContext?.http?.path ||
    "/") as string;

  try {
    let path = decodeURIComponent(raw)
      .replace(/^\/(\$default|api)/, "")
      .replace(/\/+/g, "/");

    if (path.includes("..") || path.includes("%2e%2e")) return "/";

    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    return path || "/";
  } catch {
    return "/";
  }
}

/**
 * Extracts HTTP method and path from various event formats.
 */
export function extractRequestMetadata(event: APIGatewayProxyEventV2): {
  method: string;
  path: string;
} {
  const method =
    (event as unknown as Record<string, unknown>).method ||
    (event as unknown as Record<string, unknown>).httpMethod ||
    event.requestContext?.http?.method ||
    "GET";
  return { method: method as string, path: normalizePath(event) };
}

/**
 * Redacts sensitive information from the Lambda event before logging.
 */
export function maskEvent(event: APIGatewayProxyEventV2): unknown {
  const masked = { ...event };

  if (event.headers) {
    masked.headers = redactRecord(event.headers, REDACTED_HEADERS);
  }

  const anyEvent = event as unknown as Record<string, unknown>;
  const multiValueHeaders = anyEvent.multiValueHeaders as Record<
    string,
    string[]
  >;
  if (multiValueHeaders) {
    (masked as unknown as Record<string, unknown>).multiValueHeaders =
      redactRecord(multiValueHeaders, REDACTED_HEADERS, (val) =>
        val.map(() => "[REDACTED]"),
      );
  }

  if (event.cookies) {
    masked.cookies = event.cookies.map(() => "[REDACTED]");
  }

  if (event.queryStringParameters) {
    masked.queryStringParameters = redactRecord(event.queryStringParameters);
  }

  const multiValueQueryParams = anyEvent.multiValueQueryStringParameters as
    | Record<string, string[]>
    | undefined;
  if (multiValueQueryParams) {
    (
      masked as unknown as Record<string, unknown>
    ).multiValueQueryStringParameters = redactRecord(
      multiValueQueryParams,
      undefined,
      (val) => val.map(() => "[REDACTED]"),
    );
  }

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

/**
 * Extracts an ID from a path given a prefix.
 */
export function extractIdFromPath(path: string, prefix: string): string | null {
  if (!path.startsWith(prefix)) return null;
  const id = path.slice(prefix.length);
  return id.includes("/") ? null : id;
}

/**
 * Retrieves a header value in a case-insensitive manner.
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
 */
export function stripLocalFields(data: unknown): unknown {
  return recursiveTransform(data, (key) => {
    if (INTERNAL_KEYS.has(key)) {
      return { skip: true };
    }
    return { skip: false };
  });
}
