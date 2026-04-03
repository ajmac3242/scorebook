import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncService } from "./syncService";
import { db, type Game } from "../db";
import { logger } from "./logger";

// Mock Dexie
vi.mock("../db", () => ({
  db: {
    transaction: vi.fn((_mode, _tables, cb) => cb()),
    teams: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(undefined),
    },
    players: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(undefined),
    },
    teamPlayers: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(undefined),
    },
    games: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    stats: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
  },
}));

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
  });

  it("syncTeamRoster fetches and updates local DB", async () => {
    const mockData = {
      team: { id: "t1", name: "Team 1" },
      players: [{ playerId: "p1", name: "Player 1", jerseyNumber: "10" }],
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
    expect(db.teams.put).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1", synced: 1 }),
    );
    expect(db.players.put).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", synced: 1 }),
    );
    expect(localStorage.getItem("etag_team_t1")).toBe("etag-1");
  });

  it("syncTeamRoster skips if 304 Not Modified", async () => {
    localStorage.setItem("etag_team_t1", "etag-1");
    vi.mocked(db.teams.get).mockResolvedValue({ id: "t1" });

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
    expect(db.teams.put).not.toHaveBeenCalled();
  });

  it("syncTeamRoster does NOT skip if IndexedDB is empty even if ETag exists", async () => {
    localStorage.setItem("etag_team_t1", "etag-1");
    vi.mocked(db.teams.get).mockResolvedValue(undefined);

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
      vi.mocked(db.teams.count).mockResolvedValue(1);
      const result = await syncService.hasUnsyncedChanges();
      expect(result).toBe(true);
    });

    it("returns false if all tables are synced", async () => {
      vi.mocked(db.teams.count).mockResolvedValue(0);
      vi.mocked(db.players.count).mockResolvedValue(0);
      vi.mocked(db.teamPlayers.count).mockResolvedValue(0);
      vi.mocked(db.games.count).mockResolvedValue(0);
      vi.mocked(db.stats.count).mockResolvedValue(0);

      const result = await syncService.hasUnsyncedChanges();
      expect(result).toBe(false);
    });
  });

  describe("pushUpdates", () => {
    it("handles game completion", async () => {
      const mockGame = { id: 10, completed: 1, synced: 0 };
      vi.mocked(db.games.toArray).mockResolvedValue([mockGame]);
      fetchMock.mockResolvedValue({ ok: true, headers: new Headers() });
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
      expect(db.games.update).toHaveBeenCalledWith(10, { synced: 1 });
    });

    it("pushes all entities", async () => {
      vi.mocked(db.teams.toArray).mockResolvedValue([{ id: 2, synced: 0 }]);
      vi.mocked(db.players.toArray).mockResolvedValue([{ id: 3, synced: 0 }]);
      vi.mocked(db.teamPlayers.toArray).mockResolvedValue([
        { id: 4, teamId: 2, synced: 0 },
      ]);
      vi.mocked(db.games.toArray).mockResolvedValue([
        { id: 5, teamId: 2, synced: 0 },
      ]);
      vi.mocked(db.stats.toArray).mockResolvedValue([
        { id: 6, gameId: 5, synced: 0 },
      ]);

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

      expect(db.teams.update).toHaveBeenCalled();
      expect(db.players.update).toHaveBeenCalled();
      expect(db.teamPlayers.update).toHaveBeenCalled();
      expect(db.games.update).toHaveBeenCalled();
      expect(db.stats.update).toHaveBeenCalled();
    });

    it("logs an error and continues if the API returns 500", async () => {
      // Ensure other tables return empty
      vi.mocked(db.teamPlayers.toArray).mockResolvedValue([]);
      vi.mocked(db.games.toArray).mockResolvedValue([]);
      vi.mocked(db.stats.toArray).mockResolvedValue([]);

      vi.mocked(db.teams.toArray).mockResolvedValue([{ id: "t1", synced: 0 }]);
      vi.mocked(db.players.toArray).mockResolvedValue([
        { id: "p1", synced: 0 },
      ]);

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
      expect(db.teams.update).not.toHaveBeenCalled();
      // Player update SHOULD have been called due to successful second push
      expect(db.players.update).toHaveBeenCalledWith("p1", { synced: 1 });

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

      vi.mocked(db.games.toArray).mockResolvedValue([
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
      ] as Game[]);

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

      vi.mocked(db.games.toArray).mockResolvedValue([
        {
          id: "g1",
          completed: 1,
          teamId: "t1",
          opponent: "Opponent",
          date: "2023-01-01",
          location: "Home",
        },
      ] as Game[]);

      await syncService.pullAll();

      expect(fetchMock).toHaveBeenCalledWith("/api/teams", expect.any(Object));
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/players",
        expect.any(Object),
      );
      expect(db.teams.put).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t1" }),
      );
      expect(db.players.put).toHaveBeenCalledWith(
        expect.objectContaining({ id: "p1" }),
      );
      expect(syncTeamRosterSpy).toHaveBeenCalledWith("t1");
      expect(syncTeamGamesListSpy).toHaveBeenCalledWith("t1");
      expect(syncGameStatsSpy).toHaveBeenCalledWith("g1");
    });
  });
});
