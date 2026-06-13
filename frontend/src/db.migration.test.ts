import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto"; // Replaces global indexedDB with in-memory version
import Dexie from "dexie";

// Unmock ./db to get the actual AppDatabase class
vi.unmock("./db");

// Import the actual AppDatabase class (not the mock)
import { AppDatabase } from "./db";

describe("AppDatabase schema", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    // Each test gets a fresh in-memory database
    // fake-indexeddb/auto resets between tests when using indexedDB.deleteDatabase
    db = new AppDatabase();
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(db.name);
  });

  it("opens successfully on a fresh install", async () => {
    expect(db.isOpen()).toBe(true);
  });

  it("contains all expected tables", async () => {
    const tableNames = db.tables.map((t) => t.name);
    expect(tableNames).toContain("players");
    expect(tableNames).toContain("teams");
    expect(tableNames).toContain("games");
    expect(tableNames).toContain("stats");
    expect(tableNames).toContain("opponents");
    expect(tableNames).toContain("teamPlayers");
  });

  it("players table has the correct primary key", async () => {
    const schema = db.players.schema;
    expect(schema.primKey.name).toBe("id");
  });

  it("stats table has an index on gameId", async () => {
    const schema = db.stats.schema;
    const indexNames = schema.indexes.map((i) => i.name);
    expect(indexNames).toContain("gameId");
  });

  it("can write and read a player record", async () => {
    await db.players.add({ id: "p1", name: "Test Player" });
    const player = await db.players.get("p1");
    expect(player?.name).toBe("Test Player");
  });

  it("can write and read a stat record", async () => {
    // Use any because we don't want to fill all mandatory fields for this simple schema test
    await db.stats.add({
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: "FIELD_GOAL",
      period: 1,
      timestamp: new Date().toISOString(),
    } as any);
    const stats = await db.stats.where("gameId").equals("g1").toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe("FIELD_GOAL");
  });

  it("cascades correctly when querying stats by gameId", async () => {
    await db.stats.bulkAdd([
      {
        id: "s1",
        gameId: "g1",
        playerId: "p1",
        type: "FIELD_GOAL",
        period: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: "s2",
        gameId: "g1",
        playerId: "p2",
        type: "ASSIST",
        period: 1,
        timestamp: new Date().toISOString(),
      },
      {
        id: "s3",
        gameId: "g2",
        playerId: "p1",
        type: "REBOUND",
        period: 1,
        timestamp: new Date().toISOString(),
      },
    ] as any);
    const g1Stats = await db.stats.where("gameId").equals("g1").toArray();
    expect(g1Stats).toHaveLength(2);
  });

  it("migrates data correctly from version 25 to current version", async () => {
    // Create a v25 database manually with the old schema
    // Note: Use the same database name as AppDatabase uses ("ScorebookDB")
    const DB_NAME = "ScorebookDB";
    await Dexie.delete(DB_NAME);

    const v25db = new Dexie(DB_NAME);
    v25db.version(25).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced",
    });
    await v25db.open();
    await v25db
      .table("opponents")
      .add({ id: "o1", name: "Legacy Opponent", roster: [] });
    await v25db.close();

    // Open with the current AppDatabase (which should auto-migrate)
    const currentDb = new AppDatabase();
    await currentDb.open();

    const opponent = await currentDb.opponents.get("o1");
    expect(opponent?.name).toBe("Legacy Opponent"); // Data preserved through migration

    // Verify that the new index works (v27 added isArchived to opponents)
    await currentDb.opponents.update("o1", { isArchived: 1 });
    const archivedOpponents = await currentDb.opponents
      .where("isArchived")
      .equals(1)
      .toArray();
    expect(archivedOpponents).toHaveLength(1);
    expect(archivedOpponents[0].name).toBe("Legacy Opponent");

    await currentDb.close();
    await Dexie.delete(DB_NAME);
  });
});
