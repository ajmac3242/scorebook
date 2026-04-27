import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { handler } from "../index.js";
import { mockClient } from "aws-sdk-client-mock";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid"),
}));

import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("Error Reporting Tests", () => {
  let consoleSpy: jest.Spied<typeof console.error>;

  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = "TestTable";
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const createEvent = (method: string, path: string): any => ({
    version: "2.0",
    rawPath: path,
    requestContext: {
      requestId: "test-request-id",
      http: {
        method,
        path,
      },
    },
  });

  it("logs the full error but returns a generic 500 response", async () => {
    const specificError = new Error("Specific database error");
    ddbMock.on(QueryCommand).rejects(specificError);

    const event = createEvent("GET", "/players");
    const response: any = await handler(event);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");

    // Verify it was logged server-side
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[ERROR] [test-request-id] Handler Error: Specific database error",
      ),
      expect.stringContaining("Specific database error"),
    );
  });
});
