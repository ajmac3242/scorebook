import { useLiveQuery } from "dexie-react-hooks";
import { db, Season } from "../db";

/**
 * Hook to fetch all seasons from the local database.
 * @returns {Season[]} Array of seasons.
 */
export const useSeasons = () => {
  return (
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.seasons.toArray();
      } catch (err) {
        console.error("Failed to fetch seasons:", err);
        return [];
      }
    }) || []
  );
};
