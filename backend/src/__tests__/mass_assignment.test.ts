import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
} from "@jest/globals";
import { handler } from "../index.js";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "00000000-0000-4000-8000-000000000000"),
}));

describe("Mass Assignment Vulnerability Test", () => {
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
    headers: { "content-type": "application/json" },
  });

  it("vulnerability: allows injecting internal fields in team-player association", async () => {
    ddbMock.on(PutCommand).resolves({});

    const teamId = "277e909a-6536-4d2d-937e-f608759556fb";
    const playerId = "277e909a-6536-4d2d-937e-f608759556fa";

    // Attempt to inject deletedAt and a custom property that should be stripped if we used stripLocalFields properly
    const malformedBody = {
      playerId,
      jerseyNumber: "10",
      deletedAt: "2023-01-01T00:00:00.000Z",
      __proto__: { polluted: true }
    };

    const event = createEvent("POST", `/teams/${teamId}/players`, malformedBody);
    await handler(event);

    const putCalls = ddbMock.commandCalls(PutCommand);
    expect(putCalls.length).toBe(1);
    const item = putCalls[0].args[0].input.Item;

    if (!item) throw new Error("Item not found in PutCommand");

    // THIS EXPECTATION IS EXPECTED TO FAIL BEFORE THE FIX
    // because current implementation does { ...body } and only deletes 'id'
    expect(item.deletedAt).toBeUndefined();
    expect(item.polluted).toBeUndefined();
  });
});
