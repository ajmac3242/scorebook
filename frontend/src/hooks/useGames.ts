import { useLiveQuery } from "dexie-react-hooks";
import { db, Game } from "../db";

/**
 * Hook to fetch games for a specific team from the local database.
 * @param {string} teamId - The team ID.
 * @returns {Game[]} Array of games.
 */
export const useGames = (teamId?: string) => {
  return (
    useLiveQuery(
      () =>
        teamId !== undefined
          ? db.games.where("teamId").equals(teamId.toString()).toArray()
          : Promise.resolve([]),
      [teamId],
    ) || []
  );
};
