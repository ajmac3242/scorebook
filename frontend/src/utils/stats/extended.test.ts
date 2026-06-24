import { describe, it, expect } from "vitest";
import {
  calculateOpponentScoutingStats,
  calculatePlayEfficiency,
} from "../../stats";
import { StatEvent } from "../../../db";

describe("Opponent Scouting and Play Efficiency", () => {
  const events: StatEvent[] = [
    // Play: 'Horns' - 4 events, 1 make (2pts), 1 miss, 1 TO, 1 make (3pts).
    {
      id: "1",
      gameId: "g1",
      playerId: "OPPONENT:10",
      type: "MAKE",
      points: 2,
      playName: "Horns",
      period: 1,
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      gameId: "g1",
      playerId: "OPPONENT:10",
      type: "MISS",
      playName: "Horns",
      period: 1,
      timestamp: new Date().toISOString(),
    },
    {
      id: "3",
      gameId: "g1",
      playerId: "OPPONENT:11",
      type: "TURNOVER",
      playName: "Horns",
      period: 1,
      timestamp: new Date().toISOString(),
    },
    {
      id: "5",
      gameId: "g1",
      playerId: "OPPONENT:10",
      type: "MAKE",
      points: 3,
      playName: "Horns",
      period: 1,
      timestamp: new Date().toISOString(),
    },
    // Play: 'ISO' - 1 event, 1 make (3pts).
    {
      id: "4",
      gameId: "g1",
      playerId: "p1",
      type: "MAKE",
      points: 3,
      playName: "ISO",
      period: 1,
      timestamp: new Date().toISOString(),
    },
  ];

  it("calculates opponent scouting stats correctly", () => {
    const stats = calculateOpponentScoutingStats(events);
    const p10 = stats.get("OPPONENT:10");
    const p11 = stats.get("OPPONENT:11");

    expect(p10).toBeDefined();
    expect(p10?.points).toBe(5);
    expect(p10?.makes).toBe(2);
    expect(p10?.attempts).toBe(3);

    expect(p11).toBeDefined();
    expect(p11?.turnovers).toBe(1);
  });

  it("calculates play efficiency correctly", () => {
    const plays = calculatePlayEfficiency(events);
    const horns = plays.find((p) => p.name === "Horns");
    const iso = plays.find((p) => p.name === "ISO");

    expect(horns).toBeDefined();
    // Horns: 2 MAKE (2pt, 3pt), 1 MISS, 1 TO.
    expect(horns?.attempts).toBe(3);
    expect(horns?.makes).toBe(2);
    expect(horns?.points).toBe(5);
    // Horns PPP: calculatePossessions(3, 0, 1, 0) = 4. 5/4 = 1.25
    expect(horns?.ppp).toBe("1.25");
    // Horns eFG: calculateEfgPct(2, 1, 3) = (2 + 0.5*1)/3 = 2.5/3 = 83.3%
    expect(horns?.efg).toBe("83.3");

    expect(iso).toBeDefined();
    expect(iso?.attempts).toBe(1);
    expect(iso?.makes).toBe(1);
    expect(iso?.points).toBe(3);
    // ISO PPP: calculatePossessions(1, 0, 0, 0) = 1. 3/1 = 3.00
    expect(iso?.ppp).toBe("3.00");
    // ISO eFG: calculateEfgPct(1, 1, 1) = (1 + 0.5*1)/1 = 1.5/1 = 150.0%
    expect(iso?.efg).toBe("150.0");
  });
});
