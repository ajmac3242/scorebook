import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

/**
 * Hook to fetch teams from the local database.
 * @returns {Team[]} Array of teams.
 */
export const useTeams = () => {
  return useLiveQuery<any>(() => db.teams.toArray()) || [];
};
