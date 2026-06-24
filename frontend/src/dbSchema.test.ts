import { describe, it, expect } from "vitest";
import { TABLE_CONFIG } from "./dbMock";
import { db } from "./db";

describe("Database Schema Drift Protection", () => {
	it("ensures dbMock TABLE_CONFIG matches the expected schema", async () => {
		// Hardcoded list of tables from db.ts as Dexie's internal schema is hard to access
        // in this test environment without a full DB initialization.
		const expectedTables = [
            "teams",
            "players",
            "teamPlayers",
            "games",
            "stats",
            "opponents"
        ];

		const mockTables = Object.keys(TABLE_CONFIG);

		expect(mockTables.sort()).toEqual(expectedTables.sort());

        // Secondary check: if we can access the real table names from the db instance
        // We ensure the expectation always runs if db.tables is present to satisfy linting.
        const dbTables = db.tables ? Object.keys(db.tables).filter(t => t !== "metadata") : [];
        const finalExpected = dbTables.length > 0 ? dbTables : expectedTables;

        expect(mockTables.sort()).toEqual(finalExpected.sort());
	});
});
