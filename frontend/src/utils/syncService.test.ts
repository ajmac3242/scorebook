import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncService } from "./syncService";
import { db } from "../db";

// Mock Dexie
vi.mock("../db", () => ({
  db: {
    transaction: vi.fn((_mode, _tables, cb) => cb()),
    teams: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    },
    players: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    },
    teamPlayers: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    },
    games: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    },
    stats: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    },
    seasons: {
        put: vi.fn(),
        where: vi.fn().mockReturnThis(),
        equals: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([])
    }
  }
}));

// Mock UserPool
vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(() => ({
      getSession: vi.fn((cb) => cb(null, {
        isValid: () => true,
        getAccessToken: () => ({ getJwtToken: () => "test-token" })
      }))
    }))
  }
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
      players: [{ id: "p1", name: "Player 1", jerseyNumber: "10" }]
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
      headers: new Headers({ "ETag": "etag-1" })
    });

    await syncService.syncTeamRoster("t1");

    expect(fetchMock).toHaveBeenCalledWith("/data/teams/t1/roster.json", expect.any(Object));
    expect(db.teams.put).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", synced: 1 }));
    expect(db.players.put).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", synced: 1 }));
    expect(localStorage.getItem("etag_team_t1")).toBe("etag-1");
  });

  it("syncTeamRoster skips if 304 Not Modified", async () => {
    localStorage.setItem("etag_team_t1", "etag-1");
    fetchMock.mockResolvedValue({
      status: 304,
      ok: false
    });

    await syncService.syncTeamRoster("t1");

    expect(fetchMock).toHaveBeenCalledWith(
        "/data/teams/t1/roster.json",
        expect.objectContaining({ headers: expect.objectContaining({ "If-None-Match": "etag-1" }) })
    );
    expect(db.teams.put).not.toHaveBeenCalled();
  });
});
