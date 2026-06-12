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
    const table = createTable<{ id: string; gameId: string; type: string }>(
      "stats",
    );
    await table.add({ id: "s1", gameId: "g1", type: "FIELD_GOAL" });
    await table.add({ id: "s2", gameId: "g1", type: "ASSIST" });
    const results = await table
      .where("[gameId+type]")
      .equals(["g1", "FIELD_GOAL"])
      .toArray();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("s1");
  });
});
