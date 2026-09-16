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

  it("preserves offline sync metadata properties on added and updated entity records", async () => {
    const table = createTable<{ id: string; name: string; synced: number }>(
      "teams",
    );
    await table.add({ id: "t1", name: "Lakers", synced: 0 });
    const added = await table.get("t1");
    expect(added?.synced).toBe(0);

    await table.update("t1", { synced: 1 });
    const updated = await table.get("t1");
    expect(updated?.synced).toBe(1);
  });
});
