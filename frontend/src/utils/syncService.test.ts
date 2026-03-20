import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncService } from "./syncService";
import { db } from "../db";

// Mock Dexie
vi.mock("../db", () => ({
  db: {
    transaction: vi.fn((_mode, _tables, cb) => cb()),
    seasons: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    teams: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    players: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    teamPlayers: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    games: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(1),
    },
    stats: {
      put: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
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
      players: [{ id: "p1", name: "Player 1", jerseyNumber: "10" }],
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
    fetchMock.mockResolvedValue({
      status: 304,
      ok: false,
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

  describe("hasUnsyncedChanges", () => {
    it("returns true if any table has unsynced items", async () => {
      vi.mocked(db.seasons.count).mockResolvedValue(1);
      const result = await syncService.hasUnsyncedChanges();
      expect(result).toBe(true);
    });

    it("returns false if all tables are synced", async () => {
      vi.mocked(db.seasons.count).mockResolvedValue(0);
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
    it("pushes unsynced seasons and updates local state", async () => {
      const mockSeason = { id: 1, name: "S1", synced: 0 };
      vi.mocked(db.seasons.toArray).mockResolvedValue([mockSeason]);
      fetchMock.mockResolvedValue({ ok: true });

      await syncService.pushUpdates();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/seasons",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(mockSeason),
        }),
      );
      expect(db.seasons.update).toHaveBeenCalledWith(1, { synced: 1 });
    });

    it("handles game completion", async () => {
      const mockGame = { id: 10, completed: 1, synced: 0 };
      vi.mocked(db.games.toArray).mockResolvedValue([mockGame]);
      fetchMock.mockResolvedValue({ ok: true });

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
      vi.mocked(db.seasons.toArray).mockResolvedValue([{ id: 1, synced: 0 }]);
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

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/seasons",
        expect.any(Object),
      );
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

      expect(db.seasons.update).toHaveBeenCalled();
      expect(db.teams.update).toHaveBeenCalled();
      expect(db.players.update).toHaveBeenCalled();
      expect(db.teamPlayers.update).toHaveBeenCalled();
      expect(db.games.update).toHaveBeenCalled();
      expect(db.stats.update).toHaveBeenCalled();
    });
  });
});
