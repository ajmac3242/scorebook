import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { logger } from "../utils/logger";

/**
 * Hook to fetch all players from the local database, sorted by name.
 * @returns {Player[]} Array of players.
 */
export const usePlayers = () => {
  return (
    useLiveQuery(() => {
      return db.players
        .toArray()
        .then((items) => {
          // ⚡ Bolt: Use direct comparison instead of localeCompare for significantly faster sorting in hot paths.
          return items.sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          });
        })
        .catch((err) => {
          logger.error("Failed to fetch players:", err);
          return [];
        });
    }) || []
  );
};
