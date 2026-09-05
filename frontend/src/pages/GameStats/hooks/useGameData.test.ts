import { renderHook, waitFor } from "../../../test-utils";
import { useGameData } from "./useGameData";
import { mockDb } from "../../../dbMock";
import { describe, it, expect, beforeEach } from "vitest";

describe("useGameData", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("returns default empty/fallback structures when gameId is undefined", async () => {
    const { result } = renderHook(() => useGameData(undefined));

    await waitFor(() => {
      expect(result.current.game).toBeUndefined();
    });

    expect(result.current.team).toBeUndefined();
    expect(result.current.teamSeasonStats).toEqual({
      ppp: "0.00",
      ftPct: "0.0",
      turnoverRate: "0.0",
      orebPct: "0.0",
    });
    expect(result.current.teamPlayers).toEqual([]);
    expect(result.current.players).toEqual([]);
    expect(result.current.allStats).toEqual([]);
  });

  it("fetches game, team, players, team season stats, and game stats when gameId is provided", async () => {
    const teamId = "t-100";
    const gameId = "g-100";

    await mockDb.teams.add({ id: teamId, name: "Lakers" } as any);
    await mockDb.games.add({
      id: gameId,
      teamId,
      opponentName: "Celtics",
      date: "2026-03-01",
    } as any);

    await mockDb.players.add({ id: "p1", name: "LeBron James" } as any);
    await mockDb.teamPlayers.add({
      id: "tp1",
      teamId,
      playerId: "p1",
      jerseyNumber: "23",
    } as any);

    await mockDb.stats.add({
      id: "s1",
      gameId,
      playerId: "p1",
      type: "2FG_MAKE",
      points: 2,
    } as any);

    const { result } = renderHook(() => useGameData(gameId));

    await waitFor(() => {
      expect(result.current.game?.id).toBe(gameId);
    });

    expect(result.current.team?.name).toBe("Lakers");
    expect(result.current.teamPlayers).toHaveLength(1);
    expect(result.current.teamPlayers[0].playerId).toBe("p1");
    expect(result.current.players).toHaveLength(1);
    expect(result.current.players[0].name).toBe("LeBron James");
    expect(result.current.allStats).toHaveLength(1);
    expect(result.current.allStats[0].id).toBe("s1");
    expect(result.current.teamSeasonStats).toBeDefined();
  });
});
