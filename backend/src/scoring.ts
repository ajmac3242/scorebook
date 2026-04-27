/**
 * @file scoring.ts
 * @description Scoring and game result calculation logic for the Basketball Stats API.
 */

import { SPECIAL_PLAYER_IDS, isOpponentId } from "./validation.js";

/**
 * 🏀 Scoring Strategy: Event-Driven Accumulation
 *
 * WHY: The system uses an event-sourcing-lite approach where the current score
 * is derived by re-playing MAKE events from the stat stream. This ensures that
 * the score is always consistent with the recorded actions, even if events are
 * added out of order or deleted (soft-deleted).
 *
 * Opponent detection uses a prefix-based strategy ("OPPONENT") to allow for
 * tracking of both generic "OPPONENT" team stats and specific opponent player
 * jerseys (e.g., "OPPONENT:12") without requiring a pre-defined roster.
 */

/**
 * Accumulates the total score for both teams from a list of stat events.
 *
 * @param {Record<string, unknown>[]} stats - List of statistical events.
 * @returns {{teamScore: number, oppScore: number}} Total scores for Team and Opponent.
 */
export function accumulateScores(stats: Record<string, unknown>[]): {
  teamScore: number;
  oppScore: number;
} {
  let teamScore = 0;
  let oppScore = 0;
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (s.deletedAt) continue;

    // 🏀 Scoring Strategy: Event-Driven Consistency
    // WHY: We only increment score for MAKE events. This allows us to re-calculate
    // the total score at any time from the raw event stream, ensuring that the
    // displayed score is always derived from the source of truth.
    if (s.type !== "MAKE") continue;

    // 🛡️ Defensive Coding: Preserve integrity for legacy/malformed events
    // WHY: In cases where 'points' is missing, null, or NaN, we default to 0
    // to prevent entire score calculations from failing or returning NaN.
    const pts = (s.points as number) || 0;

    if (typeof s.playerId === "string" && isOpponentId(s.playerId)) {
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
export function determineResult(
  teamScore: number,
  oppScore: number,
): "W" | "L" | "D" {
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
