import { describe, it, expect } from "vitest";
import {
  calculateRefTightness,
  calculateArchetypeEfficiency,
  calculateMatchupEfficiency,
} from "../analytics";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { StatEvent } from "../../../db";

describe("analytics.ts utilities", () => {
  describe("calculateRefTightness", () => {
    it("returns 0 if elapsed time is less than or equal to 0.1 minutes", () => {
      const stats = [
        {
          type: ACTION_TYPES.FOUL,
          playerId: "p1",
          period: 1,
          clockTime: 599,
          timestamp: "2023-01-01T12:00:01Z",
          gameId: "g1",
        } as unknown as StatEvent,
      ];
      // 10:00 - 9:59 = 1 second = 0.016 mins
      expect(calculateRefTightness(stats, 1, 599, "QUARTERS")).toBe(0);
    });

    it("calculates fouls per minute correctly", () => {
      const stats = [
        {
          type: ACTION_TYPES.FOUL,
          playerId: "p1",
          period: 1,
          clockTime: 540,
          timestamp: "T1",
          gameId: "g1",
        } as unknown as StatEvent,
        {
          type: ACTION_TYPES.FOUL_SHOOTING,
          playerId: "p2",
          period: 1,
          clockTime: 480,
          timestamp: "T2",
          gameId: "g1",
        } as unknown as StatEvent,
      ];
      // 10:00 - 8:00 = 2 minutes elapsed. 2 fouls. FPM should be 1.0.
      expect(calculateRefTightness(stats, 1, 480, "QUARTERS")).toBe(1.0);
    });

    it("handles multiple fouls in ref tightness calculation", () => {
      const stats = [
        {
          type: ACTION_TYPES.FOUL,
          playerId: "p1",
          period: 1,
          clockTime: 480,
          timestamp: "T1",
          gameId: "g1",
        } as unknown as StatEvent,
        {
          type: ACTION_TYPES.FOUL_SHOOTING,
          playerId: "p2",
          period: 1,
          clockTime: 420,
          timestamp: "T2",
          gameId: "g1",
        } as unknown as StatEvent,
        {
          type: ACTION_TYPES.TECHNICAL_FOUL,
          playerId: "p3",
          period: 1,
          clockTime: 360,
          timestamp: "T3",
          gameId: "g1",
        } as unknown as StatEvent,
      ];
      // 10:00 - 6:00 = 4 minutes elapsed. 3 fouls. FPM = 0.75.
      expect(calculateRefTightness(stats, 1, 360, "QUARTERS")).toBe(0.75);
    });

    it("filters out deleted events", () => {
      const stats = [
        {
          type: ACTION_TYPES.FOUL,
          playerId: "p1",
          period: 1,
          clockTime: 540,
          timestamp: "T1",
          gameId: "g1",
          deletedAt: "some-date",
        } as unknown as StatEvent,
      ];
      expect(calculateRefTightness(stats, 1, 480, "QUARTERS")).toBe(0);
    });
  });

  describe("calculateArchetypeEfficiency", () => {
    it("calculates stop percentage per play type for defenders", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MISS,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          opponentPlayType: "PnR",
          primaryDefenderId: "def1",
        },
        {
          type: ACTION_TYPES.TURNOVER,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          opponentPlayType: "PnR",
          primaryDefenderId: "def1",
        },
        {
          type: ACTION_TYPES.MAKE,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          opponentPlayType: "PnR",
          primaryDefenderId: "def1",
        },
        {
          type: ACTION_TYPES.MISS,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":20",
          opponentPlayType: "ISO",
          primaryDefenderId: "def1",
        },
      ];

      const result = calculateArchetypeEfficiency(stats as StatEvent[]);

      // def1: PnR -> 2 stops out of 3 = 66.7% -> rounded to 67
      // def1: ISO -> 1 stop out of 1 = 100%
      expect(result["def1"]["PnR"]).toBe(67);
      expect(result["def1"]["ISO"]).toBe(100);
    });

    it("skips non-opponent or missing play type/defender", () => {
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MISS,
          playerId: "teamPlayer",
          opponentPlayType: "PnR",
          primaryDefenderId: "def1",
        },
        {
          type: ACTION_TYPES.MISS,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          opponentPlayType: undefined,
          primaryDefenderId: "def1",
        },
        {
          type: ACTION_TYPES.MISS,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT + ":10",
          opponentPlayType: "PnR",
          primaryDefenderId: undefined,
        },
      ];

      const result = calculateArchetypeEfficiency(stats as StatEvent[]);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe("calculateMatchupEfficiency", () => {
    it("calculates matchup efficiency using explicit matchups if defender is missing", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT + ":99";
      const stats: Partial<StatEvent>[] = [
        { type: ACTION_TYPES.MISS, playerId: oppId }, // Should use matchup def
        { type: ACTION_TYPES.MAKE, playerId: oppId, primaryDefenderId: "def2" }, // Should use def2
      ];

      const matchups = { [oppId]: "def1" };
      const result = calculateMatchupEfficiency(stats as StatEvent[], matchups);

      // def1 vs oppId: 1 stop (MISS) out of 1
      // def2 vs oppId: 0 stops (MAKE) out of 1

      const def1Match = result.find(
        (r) => r.teamPlayerId === "def1" && r.oppPlayerId === oppId,
      );
      const def2Match = result.find(
        (r) => r.teamPlayerId === "def2" && r.oppPlayerId === oppId,
      );

      expect(def1Match?.stopPct).toBe(100);
      expect(def2Match?.stopPct).toBe(0);
    });

    it("handles turnovers as stops", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT + ":55";
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.TURNOVER,
          playerId: oppId,
          primaryDefenderId: "def1",
        },
      ];
      const result = calculateMatchupEfficiency(stats as StatEvent[], {});
      expect(result[0].stopPct).toBe(100);
    });

    it("correctly identifies opponent jersey from ID", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT + ":23";
      const stats: Partial<StatEvent>[] = [
        { type: ACTION_TYPES.MISS, playerId: oppId, primaryDefenderId: "def1" },
      ];
      const result = calculateMatchupEfficiency(stats as StatEvent[], {});
      expect(result[0].oppPlayerJersey).toBe("23");
    });

    it("handles generic opponent ID without jersey", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT;
      const stats: Partial<StatEvent>[] = [
        { type: ACTION_TYPES.MISS, playerId: oppId, primaryDefenderId: "def1" },
      ];
      const result = calculateMatchupEfficiency(stats as StatEvent[], {});
      expect(result[0].oppPlayerJersey).toBe("??");
    });

    it("handles free throws as possessions", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT + ":10";
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.MAKE,
          points: 1,
          playerId: oppId,
          primaryDefenderId: "def1",
        },
      ];
      const result = calculateMatchupEfficiency(stats as StatEvent[], {});
      expect(result[0].possessions).toBe(1);
      expect(result[0].stopPct).toBe(0);
    });

    it("skips non-possession ending events", () => {
      const oppId = SPECIAL_PLAYER_IDS.OPPONENT + ":10";
      const stats: Partial<StatEvent>[] = [
        {
          type: ACTION_TYPES.REBOUND,
          playerId: oppId,
          primaryDefenderId: "def1",
        },
      ];
      const result = calculateMatchupEfficiency(stats as StatEvent[], {});
      expect(result).toHaveLength(0);
    });
  });
});
