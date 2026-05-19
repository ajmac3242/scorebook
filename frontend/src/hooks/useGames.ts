import { useLiveQuery } from "dexie-react-hooks";
import { db, type Game } from "../db";

export const useGames = (teamId?: string) => {
  return useLiveQuery<Game[]>(async () => {
    if (!teamId) return [];
    return db.games.where("teamId").equals(teamId).toArray();
  }, [teamId]);
};
