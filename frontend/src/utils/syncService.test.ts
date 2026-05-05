import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncService } from "./syncService";
import { logger } from "./logger";
import { mockDb } from "../dbMock";

// Mock UserPool
vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(() => ({
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "test-token" }),
        }),
      ),
    })),
  },
}));

describe("SyncService", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    mockDb.reset();
  });

  it("syncTeamRoster fetches and updates local DB", async () => {
    const mockData = {
      team: { id: "t1", name: "Team 1" },
      players: [{ playerId: "p1", name: "Player 1", avatarColor: "red" }],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
      headers: new Headers({ ETag: "etag-1" }),
    });

    await syncService.syncTeamRoster("t1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/data/teams/t1/roster.json",
      expect.any(Object),
    );

    const team = mockDb.teams.data.find((t) => String(t.id) === "t1");
    expect(team).toBeDefined();
    expect(team.synced).toBe(1);

    const player = mockDb.players.data.find((p) => String(p.id) === "p1");
    expect(player).toBeDefined();
    expect(player.synced).toBe(1);

    expect(localStorage.getItem("etag_team_t1")).toBe("etag-1");
  });

  it("syncTeamRoster skips if 304 Not Modified", async () => {
    localStorage.setItem("etag_team_t1", "etag-1");
    mockDb.seed({ teams: [{ id: "t1" }] });

    fetchMock.mockResolvedValue({
      status: 304,
      ok: false,
      headers: new Headers(),
    });

    await syncService.syncTeamRoster("t1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/data/teams/t1/roster.json",
      expect.objectContaining({
        headers: expect.objectContaining({ "If-None-Match": "etag-1" }),
      }),
    );
    // add/put should not have been called for update if 304
    expect(mockDb.teams.put).not.toHaveBeenCalled();
  });

  it("syncTeamRoster does NOT skip if IndexedDB is empty even if ETag exists", async () => {
    localStorage.setItem("etag_team_t1", "etag-1");
    mockDb.teams.data = [];

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ team: { id: "t1" }, players: [] }),
      headers: new Headers(),
    });

    await syncService.syncTeamRoster("t1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/data/teams/t1/roster.json",
      expect.objectContaining({
        headers: expect.not.objectContaining({ "If-None-Match": "etag-1" }),
      }),
    );
  });

  describe("hasUnsyncedChanges", () => {
    it("returns true if any table has unsynced items", async () => {
      mockDb.seed({ teams: [{ id: "t1", synced: 0 }] });
      const result = await syncService.hasUnsyncedChanges();
      expect(result).toBe(true);
    });

    it("returns false if all tables are synced", async () => {
      const result = await syncService.hasUnsyncedChanges();
      expect(result).toBe(false);
    });
  });

  describe("pushUpdates", () => {
    it("handles game completion", async () => {
      const mockGame = { id: 10, completed: 1, synced: 0 };
      mockDb.seed({ games: [mockGame] });
      fetchMock.mockResolvedValue({ ok: true, headers: new Headers() });

      await syncService.pushUpdates();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games",
        expect.objectContaining({ method: "POST" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/10/complete",
        expect.objectContaining({ method: "POST" }),
      );

      const game = mockDb.games.data.find((g) => String(g.id) === "10");
      expect(game.synced).toBe(1);
    });

    it("pushes all entities", async () => {
      mockDb.seed({
        teams: [{ id: 2, synced: 0 }],
        players: [{ id: 3, synced: 0 }],
        teamPlayers: [{ id: 4, teamId: 2, synced: 0 }],
        games: [{ id: 5, teamId: 2, synced: 0 }],
        stats: [{ id: 6, gameId: 5, synced: 0 }],
      });

      fetchMock.mockResolvedValue({ ok: true });

      await syncService.pushUpdates();

      expect(fetchMock).toHaveBeenCalledWith("/api/teams", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/players",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/teams/2/players",
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith("/api/games", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/5/stats",
        expect.any(Object),
      );

      expect(mockDb.teams.data[0].synced).toBe(1);
      expect(mockDb.players.data[0].synced).toBe(1);
      expect(mockDb.teamPlayers.data[0].synced).toBe(1);
      expect(mockDb.games.data[0].synced).toBe(1);
      expect(mockDb.stats.data[0].synced).toBe(1);
    });

    it("logs an error and continues if the API returns 500", async () => {
      mockDb.seed({
        teams: [{ id: "t1", synced: 0 }],
        players: [{ id: "p1", synced: 0 }],
      });

      const loggerErrorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => {});

      // Fail first push, succeed second
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve("Internal Error Details"),
        })
        .mockResolvedValueOnce({ ok: true, status: 201 });

      await syncService.pushUpdates();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to push team t1: Status 500"),
        undefined,
        { errorBody: "Internal Error Details" },
      );

      // Team update should NOT have been called due to 500
      expect(mockDb.teams.data[0].synced).toBe(0);
      // Player update SHOULD have been called due to successful second push
      expect(mockDb.players.data[0].synced).toBe(1);

      loggerErrorSpy.mockRestore();
    });
  });

  describe("syncAllForTeam", () => {
    it("calls sub-sync methods in order", async () => {
      const syncTeamRosterSpy = vi
        .spyOn(syncService, "syncTeamRoster")
        .mockResolvedValue(undefined);
      const syncTeamGamesListSpy = vi
        .spyOn(syncService, "syncTeamGamesList")
        .mockResolvedValue(undefined);
      const syncGameStatsSpy = vi
        .spyOn(syncService, "syncGameStats")
        .mockResolvedValue(undefined);

      mockDb.seed({
        games: [
          {
            id: "g1",
            completed: 1,
            teamId: "t1",
            opponent: "Opponent",
            date: "2023-01-01",
            location: "Home",
          },
          {
            id: "g2",
            completed: 0,
            teamId: "t1",
            opponent: "Opponent",
            date: "2023-01-02",
            location: "Home",
          },
        ],
      });

      await syncService.syncAllForTeam("t1");

      expect(syncTeamRosterSpy).toHaveBeenCalledWith("t1");
      expect(syncTeamGamesListSpy).toHaveBeenCalledWith("t1");
      expect(syncGameStatsSpy).toHaveBeenCalledWith("g1");
      expect(syncGameStatsSpy).not.toHaveBeenCalledWith("g2");
    });
  });

  describe("pullAll", () => {
    it("fetches and persists all entities", async () => {
      const syncTeamRosterSpy = vi
        .spyOn(syncService, "syncTeamRoster")
        .mockResolvedValue(undefined);
      const syncTeamGamesListSpy = vi
        .spyOn(syncService, "syncTeamGamesList")
        .mockResolvedValue(undefined);
      const syncGameStatsSpy = vi
        .spyOn(syncService, "syncGameStats")
        .mockResolvedValue(undefined);

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: "t1" }]),
        }) // /api/teams
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ id: "p1" }]),
        }); // /api/players

      mockDb.seed({
        games: [
          {
            id: "g1",
            completed: 1,
            teamId: "t1",
            opponent: "Opponent",
            date: "2023-01-01",
            location: "Home",
          },
        ],
      });

      await syncService.pullAll();

      expect(fetchMock).toHaveBeenCalledWith("/api/teams", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/players",
        expect.any(Object),
      );

      expect(
        mockDb.teams.data.find((t) => String(t.id) === "t1"),
      ).toBeDefined();
      expect(
        mockDb.players.data.find((p) => String(p.id) === "p1"),
      ).toBeDefined();

      expect(syncTeamRosterSpy).toHaveBeenCalledWith("t1");
      expect(syncTeamGamesListSpy).toHaveBeenCalledWith("t1");
      expect(syncGameStatsSpy).toHaveBeenCalledWith("g1");
    });
  });
});
