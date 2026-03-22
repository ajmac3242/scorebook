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

  const createEvent = (method: string, path: string, body: any = null): any => ({
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
      name: "Hack Season",
      PK: "HACKED#PK",
      SK: "HACKED#SK",
      GSI1PK: "HACKED#GSI",
    };

    const event = createEvent("POST", "/seasons", malformedBody);
    await handler(event);

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    const item = putCall.args[0].input.Item;

    // Internal keys should NOT be what the user provided
    if (!item) throw new Error("Item not found in PutCommand");
    expect(item.PK).not.toBe("HACKED#PK");
    expect(item.SK).not.toBe("HACKED#SK");
    expect(item.GSI1PK).not.toBe("HACKED#GSI");
    expect(item.PK).toContain("SEASON#");
  });

  it("does not leak error details in 500 responses", async () => {
    // Force an error that would normally leak sensitive info
    ddbMock.on(QueryCommand).rejects(new Error("Sensitive database connection details..."));

    const event = createEvent("GET", "/seasons");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
    expect(body.message).not.toContain("Sensitive database connection details");
  });
});
