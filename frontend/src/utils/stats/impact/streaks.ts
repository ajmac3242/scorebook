/**
 * @file streaks.ts
 * @description Player shooting streak calculation module.
 *
 * WHY: Focuses exclusively on tracking dynamic MAKE/MISS sequences per game
 * to compute real-time HOT and COLD player streak statuses.
 */

import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent } from "../../../db";
import { isActive, isScoringEvent, sortStats } from "../aggregators";

/**
 * Calculates HOT / COLD player shooting streaks from a stat stream.
 *
 * @param stats - List of stat events.
 * @param options - Processing options.
 * @param options.isSorted - Whether the input stats are already sorted by timestamp.
 * @returns Map of playerId to streak status ('HOT' | 'COLD' | null).
 */
export const calculatePlayerStreaks = (
  stats: StatEvent[],
  options: { isSorted?: boolean } = {},
): Map<string, "HOT" | "COLD" | null> => {
  if (!stats || stats.length === 0) {
    return new Map<string, "HOT" | "COLD" | null>();
  }

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
      // ⚡ Bolt: Keep sliding window fixed at last 3 shots
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
