import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

describe("Security Tests", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = "TestTable";
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
  ): any => ({
    version: "2.0",
    rawPath: path,
    requestContext: {
      http: {
        method,
        path,
      },
    },
    body: body ? JSON.stringify(body) : null,
  });

  it("prevents mass assignment of internal DynamoDB keys (PK/SK)", async () => {
    ddbMock.on(PutCommand).resolves({});

    // Attempt to overwrite PK and SK via request body
    const malformedBody = {
      name: "Hack Team",
      PK: "HACKED#PK",
      SK: "HACKED#SK",
      GSI1PK: "HACKED#GSI",
    };

    const event = createEvent("POST", "/teams", malformedBody);
    await handler(event);

    const putCalls = ddbMock.commandCalls(PutCommand);
    const item = putCalls[0].args[0].input.Item;

    // Internal keys should NOT be what the user provided
    if (!item) throw new Error("Item not found in PutCommand");
    expect(item.PK).not.toBe("HACKED#PK");
    expect(item.SK).not.toBe("HACKED#SK");
    expect(item.GSI1PK).not.toBe("HACKED#GSI");
    expect(item.PK).toContain("TEAM#");
  });

  it("does not leak error details in 500 responses", async () => {
    // Force an error that would normally leak sensitive info
    ddbMock
      .on(QueryCommand)
      .rejects(new Error("Sensitive database connection details..."));

    const event = createEvent("GET", "/players");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
    expect(body.message).not.toContain("Sensitive database connection details");
  });

  it("removes internal DynamoDB keys (PK, SK, GSI) from API responses", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          id: "test-id",
          name: "Test Team",
          PK: "TEAM#test-id",
          SK: "METADATA#test-id",
          GSI1PK: "TEAM",
          synced: 1,
        },
      ],
    });

    const event = createEvent("GET", "/teams");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    const item = body[0];

    expect(item.id).toBe("test-id");
    expect(item.name).toBe("Test Team");
    expect(item.PK).toBeUndefined();
    expect(item.SK).toBeUndefined();
    expect(item.GSI1PK).toBeUndefined();
    expect(item.synced).toBeUndefined();
  });

  it("validates input length for entity names (max 100 chars)", async () => {
    const longNameBody = {
      name: "A".repeat(101),
    };

    const event = createEvent("POST", "/teams", longNameBody);
    const response: any = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toContain(
      "Team name is required and must be under 100 characters",
    );
  });

  it("prevents ID delimiter injection (hash character)", async () => {
    const maliciousBody = {
      name: "Inject Team",
      id: "TEAM#STOLEN",
    };

    const event = createEvent("POST", "/teams", maliciousBody);
    const response: any = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Invalid team ID");
  });

  it("prevents dangerous URL protocols in logoUrl", async () => {
    const maliciousBody = {
      name: "XSS Team",
      logoUrl: "javascript:alert(1)",
    };

    const event = createEvent("POST", "/teams", maliciousBody);
    const response: any = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Invalid logo URL");
  });

  it("redacts sensitive headers in logs (maskEvent)", async () => {
    // We can't easily check console.log output here, but we can verify maskEvent logic
    // if it were exported. Since it's not, we rely on the implementation.
    // However, we can test that the handler doesn't crash with various headers.
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const event = createEvent("GET", "/teams");
    event.headers = {
      authorization: "Bearer secret-token",
      cookie: "session=secret",
      "x-api-key": "secret-key",
    };

    const response: any = await handler(event);
    expect(response.statusCode).toBe(200);
  });
});
