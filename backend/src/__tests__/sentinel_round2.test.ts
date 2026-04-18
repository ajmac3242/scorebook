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

describe("Sentinel Security Enhancements Round 2", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  const createEvent = (
    method: string,
    path: string,
    body: any = null,
  ): any => ({
    version: "2.0",
    rawPath: path,
    headers: { "content-type": "application/json" },
    requestContext: {
      http: {
        method,
        path,
      },
    },
    body: body ? JSON.stringify(body) : null,
  });

  it("Enhancement 1 & 2: validates points and period are integers", async () => {
    const gameId = "277e909a-6536-4d2d-937e-f608759556fa";

    // Test points as float
    const event1 = createEvent("POST", `/games/${gameId}/stats`, {
      type: "MAKE",
      points: 2.5,
      playerId: "OPPONENT"
    });
    const resp1: any = await handler(event1);
    expect(resp1.statusCode).toBe(400);
    expect(JSON.parse(resp1.body).message).toBe("Points must be an integer between 0 and 3");

    // Test period as float
    const event2 = createEvent("POST", `/games/${gameId}/stats`, {
      type: "MAKE",
      points: 2,
      period: 1.5,
      playerId: "OPPONENT"
    });
    const resp2: any = await handler(event2);
    expect(resp2.statusCode).toBe(400);
    expect(JSON.parse(resp2.body).message).toBe("Period must be an integer at least 1");
  });

  it("Enhancement 3 & 4: validates location and date in handleGames", async () => {
    // Test location too long
    const event1 = createEvent("POST", "/games", {
      teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      opponent: "Opp",
      location: "A".repeat(101)
    });
    const resp1: any = await handler(event1);
    expect(resp1.statusCode).toBe(400);
    expect(JSON.parse(resp1.body).message).toBe("Location must be a string under 100 characters");

    // Test date too long
    const event2 = createEvent("POST", "/games", {
      teamId: "277e909a-6536-4d2d-937e-f608759556fb",
      opponent: "Opp",
      date: "A".repeat(51)
    });
    const resp2: any = await handler(event2);
    expect(resp2.statusCode).toBe(400);
    expect(JSON.parse(resp2.body).message).toBe("Date must be a string under 50 characters");
  });

  it("Enhancement 5: validates jerseyNumber in handleTeams", async () => {
    const teamId = "277e909a-6536-4d2d-937e-f608759556fb";

    // Test non-digit
    const event1 = createEvent("POST", `/teams/${teamId}/players`, {
      playerId: "277e909a-6536-4d2d-937e-f608759556fc",
      jerseyNumber: "12A"
    });
    const resp1: any = await handler(event1);
    expect(resp1.statusCode).toBe(400);
    expect(JSON.parse(resp1.body).message).toBe("Jersey number must be 1-3 digits");

    // Test too long
    const event2 = createEvent("POST", `/teams/${teamId}/players`, {
      playerId: "277e909a-6536-4d2d-937e-f608759556fc",
      jerseyNumber: "1234"
    });
    const resp2: any = await handler(event2);
    expect(resp2.statusCode).toBe(400);
    expect(JSON.parse(resp2.body).message).toBe("Jersey number must be 1-3 digits");
  });

  it("Enhancement 6: enforces recursion limit in sanitizeOutput", async () => {
    const deepObject: any = {};
    let current = deepObject;
    // Build a deep object: root -> nested -> nested ...
    for (let i = 0; i < 15; i++) {
      current.nested = { id: `level-${i}`, PK: "SECRET" };
      current = current.nested;
    }

    // handlePlayers POST uses createItem which uses stripLocalFields, then created() which uses response() which uses sanitizeOutput.
    // However, stripLocalFields (recursive) will ALSO stop at depth 10.
    const event = createEvent("POST", "/players", { name: "Test", ...deepObject });
    ddbMock.on(PutCommand).resolves({});
    const resp: any = await handler(event);

    const body = JSON.parse(resp.body);

    // Drill down to level 10
    let drill = body;
    for (let i = 0; i < 10; i++) {
      expect(drill.nested).toBeDefined();
      drill = drill.nested;
    }

    // At level 10, stripLocalFields (during createItem) should have stopped recursing,
    // so item.nested at level 10 should be an empty object or not have the deep 'nested' property.
    // Let's re-verify the logic.
    // root (depth 0)
    // .nested (depth 1)
    // ...
    // .nested (depth 10) -> stripLocalFields(..., 10) returns {}.

    expect(drill.nested).toEqual({});
  });

  it("Enhancement 7: recursive stripLocalFields", async () => {
    const maliciousBody = {
      name: "Test Player",
      id: "277e909a-6536-4d2d-937e-f608759556fb",
      nested: {
        PK: "HACKED",
        safe: "value"
      }
    };

    const event = createEvent("POST", "/players", maliciousBody);
    ddbMock.on(PutCommand).resolves({});
    await handler(event);

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    const item = putCall.args[0].input.Item as any;
    expect(item.nested.PK).toBeUndefined();
    expect(item.nested.safe).toBe("value");
  });

  it("Enhancement 8 & 9: security headers COOP and CORP", async () => {
    const event = createEvent("GET", "/players");
    const resp: any = await handler(event);
    expect(resp.headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(resp.headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
  });

  it("Enhancement 10: hardened parseBody", async () => {
    // Test null body string
    const event1 = createEvent("POST", "/teams", null);
    event1.body = "null";
    const resp1: any = await handler(event1);
    expect(resp1.statusCode).toBe(400); // Team name is required, should not crash

    // Test non-object JSON
    const event2 = createEvent("POST", "/teams", null);
    event2.body = "123";
    const resp2: any = await handler(event2);
    expect(resp2.statusCode).toBe(400);
  });
});
