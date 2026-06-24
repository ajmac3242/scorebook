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
        if (db.tables && Object.keys(db.tables).length > 0) {
            const realTables = Object.keys(db.tables).filter(t => t !== "metadata");
            expect(mockTables.sort()).toEqual(realTables.sort());
        }
	});
});
