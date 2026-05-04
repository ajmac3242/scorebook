import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { logger } from "../utils/logger";

/**
 * Hook to fetch teams from the local database.
 * @returns {Team[]} Array of teams.
 */
export const useTeams = () => {
  return (
    useLiveQuery(() => db.teams.toArray()) || []
  );
};
