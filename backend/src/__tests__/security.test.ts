import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
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

  it("recursively removes internal keys from nested objects and arrays", async () => {
    ddbMock.on(QueryCommand).resolves({
      Items: [
        {
          id: "team-1",
          PK: "TEAM#team-1",
          players: [
            { id: "p1", PK: "PLAYER#p1", SK: "METADATA#p1" },
            { id: "p2", PK: "PLAYER#p2" },
          ],
          metadata: {
            created: "2023-01-01",
            SK: "INTERNAL_SK",
          },
        },
      ],
    });

    const event = createEvent("GET", "/teams");
    const response: any = await handler(event);
    const body = JSON.parse(response.body);
    const team = body[0];

    expect(team.PK).toBeUndefined();
    expect(team.players[0].PK).toBeUndefined();
    expect(team.players[0].SK).toBeUndefined();
    expect(team.players[1].PK).toBeUndefined();
    expect(team.metadata.SK).toBeUndefined();
    expect(team.id).toBe("team-1");
    expect(team.players[0].id).toBe("p1");
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

  it("returns 404 when a conditional update fails (ghost item protection)", async () => {
    const error = new Error("Conditional check failed");
    error.name = "ConditionalCheckFailedException";
    // @ts-ignore - Mocking a DynamoDB error
    ddbMock.on(UpdateCommand).rejects(error);

    const event = createEvent("DELETE", "/players/p1");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Item not found");
  });

  it("redacts 'Authorization' headers regardless of casing in CloudWatch logs", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const event = createEvent("GET", "/teams");
    event.headers = {
      Authorization: "Bearer secret-token-1",
      authorization: "Bearer secret-token-2",
      "X-Custom-Auth": "secret-token-3",
    };

    await handler(event);

    const logCall = consoleSpy.mock.calls.find((call) =>
      call.some((arg) => typeof arg === "string" && arg.includes("[REDACTED]")),
    );
    expect(logCall).toBeDefined();

    const logString = logCall!.join(" ");
    expect(logString).toContain('"Authorization":"[REDACTED]"');
    expect(logString).toContain('"authorization":"[REDACTED]"');
    expect(logString).toContain('"X-Custom-Auth":"secret-token-3"');

    // Ensure the original event was NOT mutated (shallow clone verification)
    expect(event.headers.Authorization).toBe("Bearer secret-token-1");

    consoleSpy.mockRestore();
  });
});
