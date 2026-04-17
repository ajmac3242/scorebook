/**
 * @file scoring.ts
 * @description Scoring and game result calculation logic for the Basketball Stats API.
 */

import { SPECIAL_PLAYER_IDS } from "./validation.js";

/**
 * Accumulates the total score for both teams from a list of stat events.
 *
 * @param {Record<string, unknown>[]} stats - List of statistical events.
 * @returns {object} Total scores for Team and Opponent.
 */
export function accumulateScores(stats: Record<string, unknown>[]) {
  let teamScore = 0;
  let oppScore = 0;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.deletedAt) continue;

    // Only increment score for MAKE events.
    if (s.type !== "MAKE") continue;

    const pts = (s.points as number) || 0;

    if (
      typeof s.playerId === "string" &&
      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT)
    ) {
      oppScore += pts;
    } else {
      teamScore += pts;
    }
  }
  return { teamScore, oppScore };
}

/**
 * Determines the game result (W, L, or D) based on team and opponent scores.
 * @param {number} teamScore - Points scored by the team.
 * @param {number} oppScore - Points scored by the opponent.
 * @returns {"W" | "L" | "D"} Result indicator.
 */
export function determineResult(teamScore: number, oppScore: number): "W" | "L" | "D" {
  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
}

/**
 * Calculates the final score and result from a list of stat events.
 *
 * @param {Record<string, unknown>[]} stats - List of stat events.
 * @returns {{teamScore: number, oppScore: number, result: string}} Object containing teamScore, oppScore, and result.
 */
export function calculateGameResultFromStats(stats: Record<string, unknown>[]) {
  const { teamScore, oppScore } = accumulateScores(stats);
  const result = determineResult(teamScore, oppScore);
  return { teamScore, oppScore, result };
}
