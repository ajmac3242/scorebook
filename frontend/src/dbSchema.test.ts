import { describe, it, expect, vi } from "vitest";
import { TABLE_CONFIG } from "./dbMock";

describe("Database Schema Drift Protection", () => {
  it("ensures dbMock TABLE_CONFIG matches the real Dexie schema in db.ts", async () => {
    // Import the actual AppDatabase class, bypassing the mock in setupTests.ts
    const { AppDatabase } =
      await vi.importActual<typeof import("./db")>("./db");
    const realDb = new AppDatabase();

    const realTables = realDb.tables;
    const realTableNames = realTables.map((t) => t.name).sort();
    const mockTableNames = Object.keys(TABLE_CONFIG).sort();

    // 1. Validate all tables exist in both
    // Mismatch indicates a new table was added to db.ts or TABLE_CONFIG in dbMock.ts
    expect(mockTableNames).toEqual(realTableNames);

    for (const table of realTables) {
      const mockConfig = TABLE_CONFIG[table.name];
      const realSchema = table.schema;

      // 2. Validate primary key
      // Mismatch indicates primary key changed in db.ts or dbMock.ts
      expect(mockConfig.primaryKey).toBe(realSchema.primKey.name);

      // 3. Validate indices
      // Dexie schema.indexes includes both simple and compound indices.
      // Index.src is the original string from the stores() definition.
      const realIndices = realSchema.indexes.map((idx) => idx.src);

      const mockIndices = [
        ...(mockConfig.indices || []),
        ...(mockConfig.compoundIndices || []).map((ci) => `[${ci.join("+")}]`),
      ];

      // Check for indices in real DB missing from mock
      const missingInMock = realIndices.filter(
        (idx) => !mockIndices.includes(idx),
      );
      expect(missingInMock).toEqual([]);

      // Check for indices in mock missing from real DB
      const missingInReal = mockIndices.filter(
        (idx) => !realIndices.includes(idx),
      );
      expect(missingInReal).toEqual([]);
    }
  });
});
