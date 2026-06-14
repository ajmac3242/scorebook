import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";

// Unmock ./db to get the actual AppDatabase class
vi.unmock("../db");

import { AppDatabase } from "../db";
import { TABLE_CONFIG } from "../dbMock";

describe("Database Schema Drift Protection", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = new AppDatabase();
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(db.name);
  });

  it("should have matching tables between db.ts and dbMock.ts", () => {
    const realTables = db.tables.map((t) => t.name);
    const mockTables = Object.keys(TABLE_CONFIG);

    expect(mockTables.sort()).toEqual(realTables.sort());
  });

  it("should have matching primary keys for all tables", () => {
    db.tables.forEach((table) => {
      const mockConfig = TABLE_CONFIG[table.name];
      if (!mockConfig) {
        throw new Error(`Table ${table.name} missing in dbMock TABLE_CONFIG`);
      }
      expect(mockConfig.primaryKey).toBe(table.schema.primKey.name);
    });
  });

  it("should have matching indices for all tables", () => {
    db.tables.forEach((table) => {
      const mockConfig = TABLE_CONFIG[table.name];
      if (!mockConfig) {
        throw new Error(`Table ${table.name} missing in dbMock TABLE_CONFIG`);
      }

      const realIndices = table.schema.indexes.map((idx) => idx.name);

      const mockIndices = [
        ...(mockConfig.indices || []),
        ...(mockConfig.compoundIndices || []).map(
          (parts) => `[${parts.join("+")}]`,
        ),
      ];

      // Sort both for comparison
      realIndices.sort();
      mockIndices.sort();

      expect(mockIndices).toEqual(realIndices);
    });
  });
});
