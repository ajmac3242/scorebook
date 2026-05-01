import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { StatEvent } from "./../../db";

/**
 * 🏀 Momentum: detectOpponentRun
 */
export const detectOpponentRun = (sortedGameStats: StatEvent[]) => {
  let tempOppRunPoints = 0;
  let teamScoredSinceOppRunStarted = false;
  for (let i = sortedGameStats.length - 1; i >= 0; i--) {
    const s = sortedGameStats[i];
    if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;

    const isOpp =
      s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");

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
 * 🏀 Momentum: detectScoringDrought
 */
export const detectScoringDrought = (
  sortedGameStats: StatEvent[],
  period: number,
  clockSeconds: number,
  periodLen: number,
) => {
  let lastTeamScoreClockTime = periodLen;
  let lastTeamScorePeriod = period;
  let foundLastTeamScore = false;

  for (let i = sortedGameStats.length - 1; i >= 0; i--) {
    const s = sortedGameStats[i];
    if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;
    const isOpp =
      s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
      s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
    if (!isOpp) {
      lastTeamScoreClockTime = s.clockTime ?? periodLen;
      lastTeamScorePeriod = s.period;
      foundLastTeamScore = true;
      break;
    }
  }

  let droughtSecs = 0;
  if (foundLastTeamScore) {
    if (lastTeamScorePeriod === period) {
      droughtSecs = lastTeamScoreClockTime - clockSeconds;
    } else if (lastTeamScorePeriod < period) {
      droughtSecs = lastTeamScoreClockTime;
      droughtSecs += (period - lastTeamScorePeriod - 1) * periodLen;
      droughtSecs += periodLen - clockSeconds;
    }
  } else {
    droughtSecs = (period - 1) * periodLen + (periodLen - clockSeconds);
  }

  if (droughtSecs >= 180) {
    return `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
  }
  return null;
};
