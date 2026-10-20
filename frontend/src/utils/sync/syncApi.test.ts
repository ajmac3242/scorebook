import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getETag,
  setETag,
  getHeaders,
  fetchApi,
  handleEtagResponse,
  persistRoster,
  persistGameStats,
} from "./syncApi";
import { mockDb } from "../../dbMock";
import { logger } from "../logger";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

vi.mock("../../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(() => ({
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "mock-jwt-token" }),
        }),
      ),
    })),
  },
}));

describe("syncApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockDb.reset();
  });

  describe("getETag and setETag", () => {
    it("gets and sets ETag in localStorage", () => {
      expect(getETag("team", "t1")).toBeNull();
      setETag("team", "t1", "etag-123");
      expect(getETag("team", "t1")).toBe("etag-123");

      setETag("team", "t1", null);
      expect(getETag("team", "t1")).toBe("etag-123");
    });
  });

  describe("getHeaders and fetchApi", () => {
    it("includes authorization token when session is valid", async () => {
      const headers = await getHeaders();
      expect(headers["Content-Type"]).toBe("application/json; charset=utf-8");
      expect(headers["Authorization"]).toBe("Bearer mock-jwt-token");
    });

    it("omits authorization token when session returns null token", async () => {
      const authApi = await import("../../api/authApi");
      vi.spyOn(authApi, "getAccessToken").mockResolvedValueOnce(null);

      const headers = await getHeaders();
      expect(headers["Content-Type"]).toBe("application/json; charset=utf-8");
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("makes fetch requests with default options when no headers options provided", async () => {
      let capturedRequest: Request | null = null;
      server.use(
        http.get("*/api/test-no-opts", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ ok: true });
        }),
      );

      const res = await fetchApi("/api/test-no-opts");
      expect(res.ok).toBe(true);
      expect(capturedRequest?.headers.get("Authorization")).toBe("Bearer mock-jwt-token");
    });

    it("makes fetch requests with headers merged", async () => {
      let capturedRequest: Request | null = null;
      server.use(
        http.get("*/api/test-headers", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ ok: true });
        }),
      );

      const res = await fetchApi("/api/test-headers", {
        headers: { "X-Custom-Header": "custom-val" },
      });

      expect(res.ok).toBe(true);
      expect(capturedRequest?.headers.get("Authorization")).toBe(
        "Bearer mock-jwt-token",
      );
      expect(capturedRequest?.headers.get("X-Custom-Header")).toBe(
        "custom-val",
      );
    });
  });

  describe("handleEtagResponse", () => {
    it("handles 304 Not Modified status", async () => {
      server.use(
        http.get(
          "*/data/team/1",
          () => new HttpResponse(null, { status: 304 }),
        ),
      );

      const loggerSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
      const onSuccess = vi.fn();

      await handleEtagResponse(
        "team",
        "1",
        "/data/team/1",
        "etag-old",
        onSuccess,
        "Team 1",
      );

      expect(loggerSpy).toHaveBeenCalledWith("Team 1 is up to date.");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("handles 200 OK status and updates ETag", async () => {
      const mockData = { id: "t1", name: "Team 1" };
      server.use(
        http.get("*/data/team/1", () =>
          HttpResponse.json(mockData, { headers: { ETag: "etag-new" } }),
        ),
      );

      const onSuccess = vi.fn();

      await handleEtagResponse(
        "team",
        "1",
        "/data/team/1",
        "etag-old",
        onSuccess,
        "Team 1",
      );

      expect(onSuccess).toHaveBeenCalledWith(mockData);
      expect(getETag("team", "1")).toBe("etag-new");
    });

    it("handles request failure gracefully", async () => {
      server.use(http.get("*/data/team/1", () => HttpResponse.error()));

      const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
      const onSuccess = vi.fn();

      await handleEtagResponse(
        "team",
        "1",
        "/data/team/1",
        null,
        onSuccess,
        "Team 1",
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        "Sync Team 1 failed:",
        expect.any(Error),
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("does not call onSuccess or update ETag when response status is non-OK status (e.g. 500)", async () => {
      server.use(
        http.get(
          "*/data/team/1",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      const onSuccess = vi.fn();

      await handleEtagResponse(
        "team",
        "1",
        "/data/team/1",
        "etag-old",
        onSuccess,
        "Team 1",
      );

      expect(onSuccess).not.toHaveBeenCalled();
      expect(getETag("team", "1")).toBeNull();
    });
  });

  describe("persistRoster and persistGameStats", () => {
    it("persistRoster stores team and players in IndexedDB", async () => {
      const rosterSnapshot = {
        team: { id: "t1", name: "Warriors" },
        players: [{ playerId: "p1", name: "Steph", avatarColor: "#000" }],
      };

      await persistRoster("t1", rosterSnapshot);

      const team = mockDb.teams.data.find((t) => String(t.id) === "t1");
      expect(team).toBeDefined();
      expect(team.synced).toBe(1);

      const player = mockDb.players.data.find((p) => String(p.id) === "p1");
      expect(player).toBeDefined();
      expect(player.synced).toBe(1);

      const teamPlayer = mockDb.teamPlayers.data.find(
        (tp) => String(tp.playerId) === "p1" && String(tp.teamId) === "t1",
      );
      expect(teamPlayer).toBeDefined();
      expect(teamPlayer.synced).toBe(1);
    });

    it("persistGameStats preserves local active game state over remote state", async () => {
      mockDb.seed({
        games: [
          {
            id: "g1",
            completed: 0,
            clockTime: 180,
            currentPeriod: 3,
            onCourtIds: ["p1", "p2"],
            possessionArrow: "OUR_TEAM",
          },
        ],
      });

      const gameSnapshot = {
        game: {
          id: "g1",
          completed: 0,
          clockTime: 600,
          currentPeriod: 1,
          onCourtIds: [],
          possessionArrow: "OPPONENT",
        },
        stats: [{ id: "s1", gameId: "g1", type: "PTS", points: 3 }],
      };

      await persistGameStats(gameSnapshot);

      const game = mockDb.games.data.find((g) => String(g.id) === "g1");
      expect(game.clockTime).toBe(180);
      expect(game.currentPeriod).toBe(3);
      expect(game.onCourtIds).toEqual(["p1", "p2"]);
      expect(game.possessionArrow).toBe("OUR_TEAM");
      expect(game.synced).toBe(1);

      const stat = mockDb.stats.data.find((s) => String(s.id) === "s1");
      expect(stat).toBeDefined();
      expect(stat.synced).toBe(1);
    });

    it("persistGameStats updates completed game without preserving active properties", async () => {
      mockDb.seed({
        games: [
          {
            id: "g2",
            completed: 1,
            clockTime: 0,
            currentPeriod: 4,
          },
        ],
      });

      const gameSnapshot = {
        game: {
          id: "g2",
          completed: 1,
          clockTime: 0,
          currentPeriod: 4,
          opponentScore: 80,
        },
        stats: [],
      };

      await persistGameStats(gameSnapshot);

      const game = mockDb.games.data.find((g) => String(g.id) === "g2");
      expect(game.opponentScore).toBe(80);
      expect(game.synced).toBe(1);
    });

    it("persistGameStats handles local game with null/undefined active fields falling back to incoming game values", async () => {
      mockDb.seed({
        games: [
          {
            id: "g3",
            completed: 0,
            clockTime: undefined,
            currentPeriod: undefined,
            onCourtIds: undefined,
            possessionArrow: undefined,
          },
        ],
      });

      const gameSnapshot = {
        game: {
          id: "g3",
          completed: 0,
          clockTime: 400,
          currentPeriod: 2,
          onCourtIds: ["p10"],
          possessionArrow: "OPPONENT",
        },
        stats: [],
      };

      await persistGameStats(gameSnapshot);

      const game = mockDb.games.data.find((g) => String(g.id) === "g3");
      expect(game.clockTime).toBe(400);
      expect(game.currentPeriod).toBe(2);
      expect(game.onCourtIds).toEqual(["p10"]);
      expect(game.possessionArrow).toBe("OPPONENT");
    });
  });
});
