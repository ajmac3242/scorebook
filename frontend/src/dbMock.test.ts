import { describe, it, expect } from "vitest";
import { createTable } from "./dbMock";

describe("dbMock", () => {
  it("throws an error when an unregistered table name is used", () => {
    expect(() => createTable("nonExistentTable")).toThrow(
      "no config registered",
    );
  });

  it("correctly identifies records by primary key", async () => {
    const table = createTable<{ id: string; name: string }>("players");
    await table.add({ id: "p1", name: "Alice" });
    const result = await table.get("p1");
    expect(result?.name).toBe("Alice");
  });

  it("supports compound where queries", async () => {
    const table = createTable<{ id: string; teamId: string; playerId: string }>(
      "teamPlayers",
    );
    await table.add({ id: "tp1", teamId: "t1", playerId: "p1" });
    await table.add({ id: "tp2", teamId: "t1", playerId: "p2" });
    const results = await table
      .where("[teamId+playerId]")
      .equals(["t1", "p1"])
      .toArray();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("tp1");
  });
});
