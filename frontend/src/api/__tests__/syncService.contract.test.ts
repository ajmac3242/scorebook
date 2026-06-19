import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { syncService } from "../../utils/syncService";
import { mockDb } from "../../dbMock";

// Mock UserPool to provide a token for the Authorization header
vi.mock("../../UserPool", () => ({
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

describe("SyncService API Contract", () => {
  beforeEach(() => {
    mockDb.reset();
    localStorage.clear();
  });

  describe("pushUpdates", () => {
    it("sends correct POST request for teams", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ teams: [{ id: "t1", name: "Team 1", synced: 0 }] });

      server.use(
        http.post("*/api/teams", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ id: "t1", synced: 1 }, { status: 201 });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.method).toBe("POST");
      expect(capturedRequest?.headers.get("Authorization")).toBe(
        "Bearer test-token",
      );
      expect(capturedRequest?.headers.get("Content-Type")).toBe(
        "application/json; charset=utf-8",
      );

      const body = await capturedRequest?.json();
      expect(body.id).toBe("t1");
      expect(body.name).toBe("Team 1");
    });

    it("sends correct POST request for players", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ players: [{ id: "p1", name: "Player 1", synced: 0 }] });

      server.use(
        http.post("*/api/players", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ id: "p1", synced: 1 }, { status: 201 });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.method).toBe("POST");
      const body = await capturedRequest?.json();
      expect(body.id).toBe("p1");
    });

    it("sends correct POST request for team-player association", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({
        teamPlayers: [{ id: "tp1", teamId: "t1", playerId: "p1", synced: 0 }],
      });

      server.use(
        http.post("*/api/teams/t1/players", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ id: "tp1", synced: 1 }, { status: 201 });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.url).toContain("/api/teams/t1/players");
    });

    it("handles 500 error when pushing teams", async () => {
      mockDb.seed({ teams: [{ id: "t1", name: "Team 1", synced: 0 }] });

      server.use(
        http.post("*/api/teams", () => {
          return new HttpResponse("Internal Server Error", { status: 500 });
        }),
      );

      await syncService.pushUpdates();

      // Should not mark as synced
      expect(mockDb.teams.data[0].synced).toBe(0);
    });

    it("sends correct POST request for game completion", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({
        games: [{ id: "g1", teamId: "t1", completed: 1, synced: 0 }],
      });

      server.use(
        http.post("*/api/games", () =>
          HttpResponse.json({ id: "g1", synced: 1 }),
        ),
        http.post("*/api/games/g1/complete", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ success: true });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.method).toBe("POST");
      expect(capturedRequest?.url).toContain("/api/games/g1/complete");
    });

    it("sends correct POST request for games", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ games: [{ id: "g1", teamId: "t1", synced: 0 }] });

      server.use(
        http.post("*/api/games", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ id: "g1", synced: 1 }, { status: 201 });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.url).toContain("/api/games");
    });

    it("sends correct POST request for stats", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ stats: [{ id: "s1", gameId: "g1", synced: 0 }] });

      server.use(
        http.post("*/api/games/g1/stats", async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({ id: "s1", synced: 1 }, { status: 201 });
        }),
      );

      await syncService.pushUpdates();

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.url).toContain("/api/games/g1/stats");
    });
  });

  describe("syncTeamRoster", () => {
    it("sends GET request with If-None-Match header", async () => {
      let capturedRequest: Request | null = null;
      localStorage.setItem("etag_team_t1", "old-etag");
      mockDb.seed({ teams: [{ id: "t1" }] });

      server.use(
        http.get("*/data/teams/t1/roster.json", ({ request }) => {
          capturedRequest = request.clone();
          return new HttpResponse(null, { status: 304 });
        }),
      );

      await syncService.syncTeamRoster("t1");

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.headers.get("If-None-Match")).toBe("old-etag");
    });

    it("updates ETag in localStorage on 200 response", async () => {
      mockDb.seed({ teams: [{ id: "t1" }] });

      server.use(
        http.get("*/data/teams/t1/roster.json", () => {
          return HttpResponse.json(
            {
              team: { id: "t1", name: "Team 1" },
              players: [],
            },
            {
              headers: { ETag: "new-etag" },
            },
          );
        }),
      );

      await syncService.syncTeamRoster("t1");

      expect(localStorage.getItem("etag_team_t1")).toBe("new-etag");
    });
  });

  describe("syncTeamGamesList", () => {
    it("fetches team games snapshot", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ games: [{ id: "g1", teamId: "t1" }] });
      localStorage.setItem("etag_team_games_t1", "old-etag");

      server.use(
        http.get("*/data/teams/t1/games.json", ({ request }) => {
          capturedRequest = request.clone();
          return new HttpResponse(null, { status: 304 });
        }),
      );

      await syncService.syncTeamGamesList("t1");

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.headers.get("If-None-Match")).toBe("old-etag");
    });
  });

  describe("syncGameStats", () => {
    it("fetches game stats snapshot", async () => {
      let capturedRequest: Request | null = null;
      mockDb.seed({ games: [{ id: "g1", completed: 1 }] });
      localStorage.setItem("etag_game_g1", "old-etag");

      server.use(
        http.get("*/data/games/g1/stats.json", ({ request }) => {
          capturedRequest = request.clone();
          return new HttpResponse(null, { status: 304 });
        }),
      );

      await syncService.syncGameStats("g1");

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.headers.get("If-None-Match")).toBe("old-etag");
    });
  });

  describe("pullAll", () => {
    it("fetches teams and players", async () => {
      const capturedUrls: string[] = [];

      server.use(
        http.get("*/api/teams", ({ request }) => {
          capturedUrls.push(request.url);
          return HttpResponse.json([{ id: "t1" }]);
        }),
        http.get("*/api/players", ({ request }) => {
          capturedUrls.push(request.url);
          return HttpResponse.json([{ id: "p1" }]);
        }),
      );

      await syncService.pullAll();

      const hasTeams = capturedUrls.some((url) => url.includes("/api/teams"));
      const hasPlayers = capturedUrls.some((url) =>
        url.includes("/api/players"),
      );

      expect(hasTeams).toBe(true);
      expect(hasPlayers).toBe(true);
    });
  });
});
