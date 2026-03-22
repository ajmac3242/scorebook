import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

/**
 * Hook to fetch teams from the local database, optionally filtered by season.
 * @param {string} selectedSeasonId - Optional season ID to filter teams.
 * @returns {Team[]} Array of teams.
 */
export const useTeams = (selectedSeasonId?: string) => {
  return (
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!selectedSeasonId) return await db.teams.toArray();
        return await db.teams
          .where("seasonId")
          .equals(selectedSeasonId)
          .toArray();
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        return [];
      }
    }, [selectedSeasonId]) || []
  );
};
