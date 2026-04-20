import { ACTION_TYPES } from "../constants/stats";
import { StatEvent } from "../db";
import { isOpponentId, isScoringEvent, isActive } from "./stats";

/**
 * Detects if the opponent is currently on a scoring run.
 * A run is defined as 8+ consecutive points without a team score.
 *
 * @param sortedStats - Chronological list of active statistical events.
 * @returns A string representing the run (e.g., "10-0") or null.
 */
export const calculateOpponentRun = (
  sortedStats: StatEvent[],
): string | null => {
  let tempOppRunPoints = 0;
  let teamScoredSinceOppRunStarted = false;

  for (let i = sortedStats.length - 1; i >= 0; i--) {
    const s = sortedStats[i];
    if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp = isOpponentId(s.playerId);

    if (isOpp) {
      if (teamScoredSinceOppRunStarted) break;
      tempOppRunPoints += s.points || 0;
    } else {
      teamScoredSinceOppRunStarted = true;
      break;
    }
  }

  return tempOppRunPoints >= 8 ? `${tempOppRunPoints}-0` : null;
};

/**
 * Detects if the team is currently in a scoring drought.
 * A drought is defined as 3+ minutes without a team score.
 *
 * @param sortedStats - Chronological list of active statistical events.
 * @param currentPeriod - Current game period.
 * @param clockSeconds - Current clock time in seconds.
 * @param periodLen - Length of a standard period in seconds.
 * @returns A string representing the drought duration or null.
 */
export const calculateScoringDrought = (
  sortedStats: StatEvent[],
  currentPeriod: number,
  clockSeconds: number,
  periodLen: number = 600,
): string | null => {
  let lastTeamScoreClockTime = periodLen;
  let lastTeamScorePeriod = 1;
  let foundLastTeamScore = false;

  for (let i = sortedStats.length - 1; i >= 0; i--) {
    const s = sortedStats[i];
    if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;

    if (!isOpponentId(s.playerId)) {
      lastTeamScoreClockTime = s.clockTime ?? periodLen;
      lastTeamScorePeriod = s.period;
      foundLastTeamScore = true;
      break;
    }
  }

  let droughtSecs = 0;
  if (foundLastTeamScore) {
    if (lastTeamScorePeriod === currentPeriod) {
      droughtSecs = lastTeamScoreClockTime - clockSeconds;
    } else if (lastTeamScorePeriod < currentPeriod) {
      droughtSecs =
        lastTeamScoreClockTime +
        (currentPeriod - lastTeamScorePeriod - 1) * periodLen +
        (periodLen - clockSeconds);
    }
  } else {
    droughtSecs = (currentPeriod - 1) * periodLen + (periodLen - clockSeconds);
  }

  if (droughtSecs >= 180) {
    return `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
  }

  return null;
};

/**
 * Identifies active opponent threats based on recent scoring.
 * A threat is an opponent player with 8+ total points or 3+ consecutive FGM.
 */
export const calculateOpponentThreats = (
  sortedStats: StatEvent[],
): string[] => {
  const opponentPoints = new Map<string, number>();
  const opponentStreaks = new Map<string, number>();
  const threats = new Set<string>();

  for (let i = 0; i < sortedStats.length; i++) {
    const s = sortedStats[i];
    if (!isActive(s) || !isOpponentId(s.playerId)) continue;

    const pId = s.playerId;

    if (isScoringEvent(s)) {
      // Points-based threat
      const pts = (opponentPoints.get(pId) || 0) + (s.points || 0);
      opponentPoints.set(pId, pts);
      if (pts >= 8) threats.add(pId);

      // Streak-based threat (ignore FTs for field goal streak)
      if (s.points && s.points > 1) {
        const streak = (opponentStreaks.get(pId) || 0) + 1;
        opponentStreaks.set(pId, streak);
        if (streak >= 3) threats.add(pId);
      }
    } else if (s.type === ACTION_TYPES.MISS && s.points && s.points > 1) {
      // Reset field goal streak on miss
      opponentStreaks.set(pId, 0);
    }
  }

  return Array.from(threats);
};
