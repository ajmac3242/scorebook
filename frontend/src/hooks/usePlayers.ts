import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

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
        return items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
    }) || []
  );
};
