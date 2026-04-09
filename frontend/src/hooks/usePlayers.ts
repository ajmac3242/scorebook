import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { logger } from "../utils/logger";

/**
 * Hook to fetch all players from the local database, sorted by name.
 * @returns {Player[]} Array of players.
 */
export const usePlayers = () => {
  return (
    useLiveQuery(async () => {
      try {
        await db.open();
        const items = await db.players.toArray();
        // ⚡ Bolt: Use direct comparison instead of localeCompare for faster sorting.
        return items.sort((a, b) => {
          const nameA = a.name || "";
          const nameB = b.name || "";
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          return 0;
        });
      } catch (err) {
        logger.error("Failed to fetch players:", err);
        return [];
      }
    }) || []
  );
};
