import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock uuid to avoid ESM issues in tests
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

  it("prevents mass assignment of internal DynamoDB fields in createItem", async () => {
    ddbMock.on(PutCommand).resolves({});

    const maliciousBody = {
      name: "Malicious Season",
      PK: "OVERWRITTEN_PK",
      SK: "OVERWRITTEN_SK",
      GSI1PK: "OVERWRITTEN_GSI1PK",
      deletedAt: "2023-01-01T00:00:00.000Z"
    };

    const event = createEvent("POST", "/seasons", maliciousBody);
    await handler(event);

    const putCall = ddbMock.call(0);
    const item = (putCall.args[0].input as any).Item;

    expect(item.PK).not.toBe("OVERWRITTEN_PK");
    expect(item.SK).not.toBe("OVERWRITTEN_SK");
    expect(item.GSI1PK).not.toBe("OVERWRITTEN_GSI1PK");
    expect(item.deletedAt).toBeUndefined();
    expect(item.PK).toMatch(/^SEASON#/);
  });

  it("prevents mass assignment in team players endpoint", async () => {
    ddbMock.on(PutCommand).resolves({});

    const maliciousBody = {
      playerId: "p1",
      PK: "OVERWRITTEN_PK",
    };

    const event = createEvent("POST", "/teams/t1/players", maliciousBody);
    await handler(event);

    const putCall = ddbMock.call(0);
    const item = (putCall.args[0].input as any).Item;

    expect(item.PK).toBe("TEAM#t1");
  });

  it("returns generic error message on internal failure", async () => {
    ddbMock.on(PutCommand).rejects(new Error("Database connection failed"));

    const event = createEvent("POST", "/seasons", { name: "Test Season" });
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
    expect(body.message).not.toContain("Database connection failed");
  });
});
