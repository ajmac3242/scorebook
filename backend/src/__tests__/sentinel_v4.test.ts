import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";
import { handler } from "../index.js";
import { safeCompare } from "../utils.js";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Sentinel Security Gap Verification", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it("VERIFY: redactString only redacts the key, not the value (Information Leak)", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Force an error with sensitive info in the message
    const sensitiveError = new Error("Failed to connect with password=secret123");
    ddbMock.on(QueryCommand).rejects(sensitiveError);

    const event: any = {
      version: "2.0",
      rawPath: "/players",
      requestContext: { http: { method: "GET", path: "/players" } },
    };

    await handler(event);

    const logCall = consoleSpy.mock.calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes("[REDACTED]"))
    );

    expect(logCall).toBeDefined();
    const logMessage = logCall!.join(" ");

    // DESIRED BEHAVIOR: "Failed to connect with [REDACTED]=[REDACTED]"
    // If it fails, it means we haven't applied the fix yet.
    expect(logMessage).not.toContain("secret123");
    expect(logMessage).toContain("[REDACTED]=[REDACTED]");

    consoleSpy.mockRestore();
  });

  it("ENHANCEMENT 2: parseBody rejects prototype pollution keys", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const event: any = {
      version: "2.0",
      rawPath: "/teams",
      requestContext: { http: { method: "POST", path: "/teams" } },
      headers: { "content-type": "application/json" },
      body: '{"name": "Test Team", "__proto__": {"polluted": true}}'
    };

    const response: any = await handler(event);
    expect(response.statusCode).toBe(400);

    const logCall = consoleSpy.mock.calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes("Prototype pollution attempt detected"))
    );
    expect(logCall).toBeDefined();
    consoleSpy.mockRestore();
  });

  it("ENHANCEMENT 3: validateStringLengths is recursive", async () => {
    ddbMock.on(PutCommand).resolves({});

    const event: any = {
      version: "2.0",
      rawPath: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
      requestContext: { http: { method: "POST", path: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats" } },
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        nested: {
          very: {
            deep: "A".repeat(150) // exceeds 128
          }
        }
      })
    };

    const response: any = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain("exceeds maximum length");
  });

  it("ENHANCEMENT 4 & 5: validateObjectDepthAndSize guards against oversized payloads", async () => {
    ddbMock.on(PutCommand).resolves({});

    // Test Property Limit
    const oversizedBody: any = { type: "MAKE", playerId: "277e909a-6536-4d2d-937e-f608759556fb" };
    for (let i = 0; i < 60; i++) oversizedBody[`key${i}`] = "value";

    const event1: any = {
      version: "2.0",
      rawPath: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
      requestContext: { http: { method: "POST", path: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats" } },
      headers: { "content-type": "application/json" },
      body: JSON.stringify(oversizedBody)
    };

    const resp1: any = await handler(event1);
    expect(resp1.statusCode).toBe(400);
    expect(JSON.parse(resp1.body).message).toBe("Object property limit exceeded");

    // Test Array Limit
    const event2: any = {
      version: "2.0",
      rawPath: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
      requestContext: { http: { method: "POST", path: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats" } },
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "MAKE",
        playerId: "277e909a-6536-4d2d-937e-f608759556fb",
        tags: new Array(101).fill("tag")
      })
    };
    const resp2: any = await handler(event2);
    expect(resp2.statusCode).toBe(400);
    expect(JSON.parse(resp2.body).message).toBe("Array length limit exceeded");
  });

  it("ENHANCEMENT 6: Inject X-Request-ID into responses", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });

    const event: any = {
      version: "2.0",
      rawPath: "/teams",
      requestContext: { http: { method: "GET", path: "/teams" }, requestId: "test-req-id" },
    };

    const response: any = await handler(event);
    expect(response.headers["X-Request-ID"]).toBe("test-req-id");
  });

  it("ENHANCEMENT 8: safeCompare handles non-strings and extremely long strings", () => {
    // @ts-ignore
    expect(safeCompare(null, "secret")).toBe(false);
    expect(safeCompare("A".repeat(1025), "A".repeat(1025))).toBe(false);
    expect(safeCompare("valid", "valid")).toBe(true);
  });

  it("ENHANCEMENT 9: validateStringLengths rejects null bytes", async () => {
    ddbMock.on(PutCommand).resolves({});

    const event: any = {
      version: "2.0",
      rawPath: "/teams",
      requestContext: { http: { method: "POST", path: "/teams" } },
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Hacker\0Team",
      })
    };

    const response: any = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain("contains invalid characters");
  });

  it("ENHANCEMENT 10: validateStringLengths enforces recursion depth", async () => {
    ddbMock.on(PutCommand).resolves({});

    // Create a deeply nested object
    const deepObj: any = { type: "MAKE", playerId: "277e909a-6536-4d2d-937e-f608759556fb" };
    let current = deepObj;
    for (let i = 0; i < 15; i++) {
      current.nested = {};
      current = current.nested;
    }

    const event: any = {
      version: "2.0",
      rawPath: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
      requestContext: { http: { method: "POST", path: "/games/277e909a-6536-4d2d-937e-f608759556fb/stats" } },
      headers: { "content-type": "application/json" },
      body: JSON.stringify(deepObj)
    };

    const response: any = await handler(event);
    expect(response.statusCode).toBe(400);
    // It will hit validateObjectDepthAndSize first (limit 5) or validateStringLengths (limit 10)
    expect(JSON.parse(response.body).message).toMatch(/limit exceeded|depth exceeded/);
  });
});
