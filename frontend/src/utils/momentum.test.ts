import { describe, it, expect } from "vitest";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";

// Note: Logic is currently internal to GameMode.tsx eventAggregates useMemo.
// In a real refactor, this logic would be moved to a utility function in stats.ts.
// For now, we will document the logic via this test and ensure it's robust.

/**
 * Ported logic for testing
 */
const detectOpponentRun = (
  sortedGameStats: {
    deletedAt?: string;
    type: string;
    playerId: string;
    points?: number;
  }[],
) => {
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

const detectScoringDrought = (
  sortedGameStats: {
    deletedAt?: string;
    type: string;
    playerId: string;
    clockTime?: number;
    period: number;
  }[],
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

describe("Momentum Alert Logic", () => {
  describe("Opponent Run Detection", () => {
    it("detects an 8-0 run", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
      ];
      expect(detectOpponentRun(stats)).toBe("8-0");
    });

    it("ignores run if team scores", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        { type: ACTION_TYPES.MAKE, points: 2, playerId: "p1" }, // Our team
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
      ];
      expect(detectOpponentRun(stats)).toBeNull();
    });

    it("detects extended runs (e.g. 11-0)", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
      ];
      expect(detectOpponentRun(stats)).toBe("11-0");
    });

    it("ignores deleted events", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        },
        {
          type: ACTION_TYPES.MAKE,
          points: 3,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          deletedAt: "today",
        },
      ];
      expect(detectOpponentRun(stats)).toBeNull(); // only 5-0 active
    });
  });

  describe("Scoring Drought Detection", () => {
    const periodLen = 600; // 10 mins

    it("detects drought within the same period", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "p1",
          period: 1,
          clockTime: 500,
        },
      ];
      // 500 - 300 = 200s (3m 20s)
      expect(detectScoringDrought(stats, 1, 300, periodLen)).toBe("3m 20s");
      // 500 - 400 = 100s (< 3m)
      expect(detectScoringDrought(stats, 1, 400, periodLen)).toBeNull();
    });

    it("detects drought across periods", () => {
      const stats = [
        {
          type: ACTION_TYPES.MAKE,
          points: 2,
          playerId: "p1",
          period: 1,
          clockTime: 100,
        }, // 1:40 left in P1
      ];
      // P2 start = 600s. 100s left in P1 + 100s elapsed in P2 = 200s
      expect(detectScoringDrought(stats, 2, 500, periodLen)).toBe("3m 20s");
    });

    it("detects drought from start of game if no scores", () => {
      const stats: {
        deletedAt?: string;
        type: string;
        playerId: string;
        clockTime?: number;
        period: number;
      }[] = [];
      // 4 minutes into P1 (600 - 360 = 240s)
      expect(detectScoringDrought(stats, 1, 360, periodLen)).toBe("4m 0s");
    });
  });
});
