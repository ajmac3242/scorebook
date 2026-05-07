/**
 * @file impact.ts
 * @description Impact and streak metrics.
 */

import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../types/stat";
import { isActive, isScoringEvent, sortStats } from "./aggregators";

export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  const playerStreaks = new Map<string, ("MAKE" | "MISS")[]>();
  let currentGameId: string | null = null;

  const sorted = options.isSorted ? stats : sortStats(stats);

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      playerStreaks.clear();
    }

    if (isScoringEvent(s) || s.type === ACTION_TYPES.MISS) {
      if (s.points === 1) continue;

      const pId = s.playerId;
      let history = playerStreaks.get(pId);
      if (!history) {
        history = [];
        playerStreaks.set(pId, history);
      }

      history.push(isScoringEvent(s) ? "MAKE" : "MISS");
      if (history.length > 3) {
        history.shift();
      }
    }
  }

  const result = new Map<string, "HOT" | "COLD" | null>();
  for (const [pId, history] of playerStreaks.entries()) {
    if (history.length < 3) {
      result.set(pId, null);
      continue;
    }

    if (
      history[0] === "MAKE" &&
      history[1] === "MAKE" &&
      history[2] === "MAKE"
    ) {
      result.set(pId, "HOT");
    } else if (
      history[0] === "MISS" &&
      history[1] === "MISS" &&
      history[2] === "MISS"
    ) {
      result.set(pId, "COLD");
    } else {
      result.set(pId, null);
    }
  }

  return result;
};

export const calculateStopsAndKills = (stats: StatEvent[]) => {
  let totalStops = 0;
  let totalKills = 0;
  let currentStreak = 0;

  let inOpponentPossession = false;
  let isOurPossession = false;
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = false;
    }

    const isOpp =
      s.playerId === "OPPONENT" || s.playerId.startsWith("OPPONENT:");

    if (isOpp && s.type === ACTION_TYPES.MAKE) {
      currentStreak = 0;
      inOpponentPossession = false;
      isOurPossession = true;
      continue;
    }

    if (!isOpp && s.type === ACTION_TYPES.MAKE) isOurPossession = false;
    if (!isOpp && s.type === ACTION_TYPES.TURNOVER) isOurPossession = false;
    if (
      isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = false;
    if (
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    )
      isOurPossession = true;

    if (
      !isOpp &&
      (s.type === ACTION_TYPES.FOUL ||
        s.type === ACTION_TYPES.FOUL_SHOOTING ||
        s.type === ACTION_TYPES.FOUL_NON_SHOOTING ||
        s.type === ACTION_TYPES.TECHNICAL_FOUL)
    ) {
      if (!isOurPossession || s.type === ACTION_TYPES.TECHNICAL_FOUL) {
        currentStreak = 0;
      }
      continue;
    }

    if (isOpp && s.type === ACTION_TYPES.TURNOVER) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    } else if (isOpp && s.type === ACTION_TYPES.MISS) {
      inOpponentPossession = true;
    } else if (
      inOpponentPossession &&
      !isOpp &&
      (s.type === ACTION_TYPES.DEF_REBOUND || s.type === ACTION_TYPES.REBOUND)
    ) {
      totalStops++;
      currentStreak++;
      inOpponentPossession = false;
      isOurPossession = true;
    } else if (
      inOpponentPossession &&
      isOpp &&
      s.type === ACTION_TYPES.OFF_REBOUND
    ) {
      // continues
    }

    if (currentStreak >= 3) {
      totalKills++;
      currentStreak = 0;
    }
  }

  return { totalStops, totalKills, currentStreak };
};
