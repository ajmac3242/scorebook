import { useLiveQuery } from "dexie-react-hooks";
import { db, type Game } from "../db";

export const useGames = (teamId?: string) => {
  return useLiveQuery(
    async () => {
      if (!teamId) return [] as Game[];
      return db.games.where("teamId").equals(teamId).toArray();
    },
    [teamId],
    [] as Game[]
  );
};
