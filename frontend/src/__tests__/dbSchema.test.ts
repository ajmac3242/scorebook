import { describe, it, expect, vi } from "vitest";
import { TABLE_CONFIG } from "../dbMock";

describe("Database Schema Drift Protection", () => {
  it("ensures dbMock TABLE_CONFIG matches the real Dexie schema in db.ts", async () => {
    // Import the actual AppDatabase class, bypassing the mock in setupTests.ts
    const { AppDatabase } =
      await vi.importActual<typeof import("../db")>("../db");
    const realDb = new AppDatabase();

    const realTables = realDb.tables;
    const realTableNames = realTables.map((t) => t.name).sort();
    const mockTableNames = Object.keys(TABLE_CONFIG).sort();

    // 1. Validate all tables exist in both
    expect(
      mockTableNames,
      `Table mismatch!
Real tables: ${realTableNames.join(", ")}
Mock tables: ${mockTableNames.join(", ")}
Update TABLE_CONFIG in dbMock.ts.`,
    ).toEqual(realTableNames);

    for (const table of realTables) {
      const mockConfig = TABLE_CONFIG[table.name];
      const realSchema = table.schema;

      // 2. Validate primary key
      expect(
        mockConfig.primaryKey,
        `Primary key mismatch for table "${table.name}"!
Real: ${realSchema.primKey.name}
Mock: ${mockConfig.primaryKey}
Update TABLE_CONFIG in dbMock.ts.`,
      ).toBe(realSchema.primKey.name);

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
      expect(
        missingInMock,
        `Table "${table.name}" has indices in db.ts missing from dbMock.ts:
${missingInMock.join(", ")}
Add these to TABLE_CONFIG in dbMock.ts.`,
      ).toEqual([]);

      // Check for indices in mock missing from real DB
      const missingInReal = mockIndices.filter(
        (idx) => !realIndices.includes(idx),
      );
      expect(
        missingInReal,
        `Table "${table.name}" has indices in dbMock.ts missing from the real db.ts:
${missingInReal.join(", ")}
Either add these to db.ts or remove them from TABLE_CONFIG in dbMock.ts.`,
      ).toEqual([]);
    }
  });
});
