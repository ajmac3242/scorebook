import { jest } from "@jest/globals";
import { handler } from "../index.js";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "277e909a-6536-4d2d-937e-f608759556fb"),
}));

describe("Validation Logic", () => {
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

  describe("UUID Validation", () => {
    it("accepts valid UUID v4", async () => {
      ddbMock.on(PutCommand).resolves({});
      const event = createEvent("POST", "/teams", {
        name: "Team A",
        id: "277e909a-6536-4d2d-937e-f608759556fb",
      });
      const response: any = await handler(event);
      expect(response.statusCode).toBe(201);
    });

    it("rejects invalid UUID formats", async () => {
      // NOTE: Our mock of uuid.v4 returns a VALID UUID.
      // If we don't provide an ID in the body, createItem uses uuid.v4().
      // To test rejection, we MUST provide an invalid ID in the body.
      const invalidIds = [
        "not-a-uuid",
        "12345",
        "g77e909a-6536-4d2d-937e-f608759556fb",
        " ",
      ];
      for (const id of invalidIds) {
        const event = createEvent("POST", "/teams", { name: "Team A", id });
        const response: any = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).message).toContain("UUID required");
      }
    });
  });

  describe("Player ID Validation", () => {
    it("accepts valid player IDs (UUID, Special Constants, Jersey Prefix)", async () => {
      ddbMock.on(PutCommand).resolves({});
      const validIds = [
        "277e909a-6536-4d2d-937e-f608759556fb", // UUID
        "OPPONENT", // Special Constant
        "OUR_TEAM", // Special Constant
        "OPPONENT:23", // Jersey Prefix
        "OPPONENT:0", // Jersey Prefix
        "OPPONENT:00", // Double zero jersey
        "OPPONENT:99", // Max length Jersey
      ];

      for (const playerId of validIds) {
        const event = createEvent(
          "POST",
          "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
          {
            type: "MAKE",
            playerId,
          },
        );
        const response: any = await handler(event);
        expect(response.statusCode).toBe(201);
      }
    });

    it("rejects invalid player IDs", async () => {
      const invalidIds = [
        "INVALID_CONSTANT",
        "OPPONENT:", // Missing jersey
        "OPPONENT:123", // Too long jersey
        "OPPONENT:ABC", // Non-numeric jersey
        "",
        null,
        123,
      ];

      for (const playerId of invalidIds) {
        const event = createEvent(
          "POST",
          "/games/277e909a-6536-4d2d-937e-f608759556fb/stats",
          {
            type: "MAKE",
            playerId,
          },
        );
        const response: any = await handler(event);
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).message).toBe(
          "Valid playerId is required",
        );
      }
    });
  });
});
