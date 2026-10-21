import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hasUnsyncedChanges,
  pushEntity,
  pushAllLocalUpdates,
} from "./syncQueue";
import { mockDb } from "../../dbMock";
import { logger } from "../logger";

describe("syncQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.reset();
  });

  describe("hasUnsyncedChanges", () => {
    it("returns true when any table has unsynced items", async () => {
      mockDb.seed({ teams: [{ id: "t1", synced: 0 }] });
      expect(await hasUnsyncedChanges()).toBe(true);
    });

    it("returns false when all items in all tables are synced", async () => {
      mockDb.seed({ teams: [{ id: "t1", synced: 1 }] });
      expect(await hasUnsyncedChanges()).toBe(false);
    });

    it("returns false and logs error when database throws an exception", async () => {
      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
      vi.spyOn(mockDb.teams, "where").mockImplementationOnce(() => {
        throw new Error("IndexedDB read failure");
      });

      expect(await hasUnsyncedChanges()).toBe(false);
      expect(loggerSpy).toHaveBeenCalledWith(
        "Error checking for unsynced changes:",
        expect.any(Error),
      );
    });
  });

  describe("pushEntity", () => {
    it("returns early if table is null or undefined", async () => {
      const fetchApi = vi.fn();
      await pushEntity(null as any, "/api/test", "test", fetchApi);
      expect(fetchApi).not.toHaveBeenCalled();
    });

    it("returns early when table has no unsynced items", async () => {
      mockDb.seed({ teams: [{ id: "t1", synced: 1 }] });
      const fetchApi = vi.fn();
      await pushEntity(mockDb.teams as any, "/api/teams", "team", fetchApi);
      expect(fetchApi).not.toHaveBeenCalled();
    });

    it("pushes items in chunks and updates synced status upon success", async () => {
      mockDb.seed({
        teams: Array.from({ length: 7 }, (_, i) => ({
          id: `t${i + 1}`,
          synced: 0,
        })),
      });

      const fetchApi = vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ success: true }), { status: 200 }),
        );

      const onSuccess = vi.fn();

      await pushEntity(
        mockDb.teams as any,
        (item) => `/api/teams/${item.id}`,
        "team",
        fetchApi,
        onSuccess,
      );

      expect(fetchApi).toHaveBeenCalledTimes(7);
      expect(onSuccess).toHaveBeenCalledTimes(7);
      expect(mockDb.teams.data.every((t) => t.synced === 1)).toBe(true);
    });

    it("handles HTTP error response, sanitizes newlines, and truncates long error messages", async () => {
      mockDb.seed({
        teams: [{ id: "t1", synced: 0 }],
      });

      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

      const shortError = "Line1\rLine2\nLine3\0Short Error";
      const fetchApi = vi
        .fn()
        .mockResolvedValue(new Response(shortError, { status: 400 }));

      await pushEntity(mockDb.teams as any, "/api/teams", "team", fetchApi);

      expect(loggerSpy).toHaveBeenCalledWith(
        "Failed to push team t1: Status 400",
        undefined,
        { errorBody: "Line1\\rLine2\\nLine3\\0Short Error" },
      );

      const longError = "Line1\rLine2\nLine3\0" + "A".repeat(600);
      const fetchApiLong = vi
        .fn()
        .mockResolvedValue(new Response(longError, { status: 500 }));

      await pushEntity(mockDb.teams as any, "/api/teams", "team", fetchApiLong);

      expect(loggerSpy).toHaveBeenCalledWith(
        "Failed to push team t1: Status 500",
        undefined,
        { errorBody: "[TRUNCATED_ERROR]" },
      );
      expect(mockDb.teams.data[0].synced).toBe(0);
    });

    it("handles fetch exception gracefully", async () => {
      mockDb.seed({
        teams: [{ id: "t1", synced: 0 }],
      });

      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
      const fetchApi = vi
        .fn()
        .mockRejectedValue(new Error("Network disconnect"));

      await pushEntity(mockDb.teams as any, "/api/teams", "team", fetchApi);

      expect(loggerSpy).toHaveBeenCalledWith(
        "Failed to push team t1:",
        expect.any(Error),
      );
      expect(mockDb.teams.data[0].synced).toBe(0);
    });
  });

  describe("pushAllLocalUpdates", () => {
    it("calls pushEntity for teams, players, teamPlayers, games, and stats", async () => {
      mockDb.seed({
        teams: [{ id: "t1", synced: 0 }],
        players: [{ id: "p1", synced: 0 }],
        teamPlayers: [{ id: "tp1", teamId: "t1", synced: 0 }],
        games: [{ id: "g1", completed: 1, synced: 0 }],
        stats: [{ id: "s1", gameId: "g1", synced: 0 }],
      });

      const fetchApi = vi.fn().mockImplementation((url) => {
        return Promise.resolve(
          new Response(JSON.stringify({ url }), { status: 200 }),
        );
      });

      await pushAllLocalUpdates(fetchApi);

      expect(fetchApi).toHaveBeenCalledWith("/api/teams", expect.any(Object));
      expect(fetchApi).toHaveBeenCalledWith("/api/players", expect.any(Object));
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/teams/t1/players",
        expect.any(Object),
      );
      expect(fetchApi).toHaveBeenCalledWith("/api/games", expect.any(Object));
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/games/g1/complete",
        expect.any(Object),
      );
      expect(fetchApi).toHaveBeenCalledWith(
        "/api/games/g1/stats",
        expect.any(Object),
      );

      expect(mockDb.teams.data[0].synced).toBe(1);
      expect(mockDb.players.data[0].synced).toBe(1);
      expect(mockDb.teamPlayers.data[0].synced).toBe(1);
      expect(mockDb.games.data[0].synced).toBe(1);
      expect(mockDb.stats.data[0].synced).toBe(1);
    });
  });
});
