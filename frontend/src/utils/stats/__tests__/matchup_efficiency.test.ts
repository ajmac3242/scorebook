import { describe, it, expect } from "vitest";
import { calculateMatchupEfficiency } from "../analytics";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("calculateMatchupEfficiency", () => {
  const teamPlayerId = "team-1";
  const oppPlayerId = "OPPONENT:10";

  it("calculates stop percentage correctly using primaryDefenderId", () => {
    const stats: Partial<StatEvent>[] = [
      {
        playerId: oppPlayerId,
        type: ACTION_TYPES.MISS,
        primaryDefenderId: teamPlayerId,
      },
      {
        playerId: oppPlayerId,
        type: ACTION_TYPES.MAKE,
        points: 2,
        primaryDefenderId: teamPlayerId,
      },
      {
        playerId: oppPlayerId,
        type: ACTION_TYPES.TURNOVER,
        primaryDefenderId: teamPlayerId,
      },
    ];

    const result = calculateMatchupEfficiency(stats as StatEvent[], {});
    const match = result.find(
      (m) => m.teamPlayerId === teamPlayerId && m.oppPlayerId === oppPlayerId,
    );

    expect(match).toBeDefined();
    // 2 stops (MISS, TURNOVER) out of 3 possessions = 67%
    expect(match?.stopPct).toBe(67);
    expect(match?.possessions).toBe(3);
  });

  it("falls back to matchups map when primaryDefenderId is missing", () => {
    const stats: Partial<StatEvent>[] = [
      {
        playerId: oppPlayerId,
        type: ACTION_TYPES.MISS,
      },
    ];
    const matchups = { [oppPlayerId]: teamPlayerId };

    const result = calculateMatchupEfficiency(stats as StatEvent[], matchups);
    const match = result.find(
      (m) => m.teamPlayerId === teamPlayerId && m.oppPlayerId === oppPlayerId,
    );

    expect(match).toBeDefined();
    expect(match?.stopPct).toBe(100);
  });

  it("ignores stats without a defender", () => {
    const stats: Partial<StatEvent>[] = [
      {
        playerId: oppPlayerId,
        type: ACTION_TYPES.MISS,
      },
    ];

    const result = calculateMatchupEfficiency(stats as StatEvent[], {});
    expect(result.length).toBe(0);
  });

  it("handles multiple matchups", () => {
    const stats: Partial<StatEvent>[] = [
      {
        playerId: "OPPONENT:10",
        type: ACTION_TYPES.MISS,
        primaryDefenderId: "team-1",
      },
      {
        playerId: "OPPONENT:20",
        type: ACTION_TYPES.MAKE,
        points: 2,
        primaryDefenderId: "team-2",
      },
    ];

    const result = calculateMatchupEfficiency(stats as StatEvent[], {});
    expect(result.length).toBe(2);
  });
});
