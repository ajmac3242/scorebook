/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from "msw";

/**
 * MSW Handlers for API contract testing.
 * Includes handlers for all endpoints used in syncService.ts and
 * common endpoints described in the testing strategy.
 */

export const handlers = [
  // Auth: get current user (Example from Phase 3.2 strategy)
  http.get("*/user", () => {
    return HttpResponse.json({
      userId: "test-user-id",
      email: "test@example.com",
      username: "testuser",
    });
  }),

  // Teams
  http.get("*/api/teams", () => {
    return HttpResponse.json([{ id: "t1", name: "Team 1", synced: 1 }]);
  }),
  http.post("*/api/teams", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ ...body, synced: 1 }, { status: 201 });
  }),

  // Players
  http.get("*/api/players", () => {
    return HttpResponse.json([{ id: "p1", name: "Player 1", synced: 1 }]);
  }),
  http.post("*/api/players", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ ...body, synced: 1 }, { status: 201 });
  }),

  // Team Players
  http.post("*/api/teams/:teamId/players", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ ...body, synced: 1 }, { status: 201 });
  }),

  // Games
  http.post("*/api/games", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ ...body, synced: 1 }, { status: 201 });
  }),
  http.post("*/api/games/:gameId/complete", () => {
    return HttpResponse.json({ success: true });
  }),

  // Stats
  http.post("*/api/games/:gameId/stats", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({ ...body, synced: 1 }, { status: 201 });
  }),
  http.post("*/api/stats/bulk", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      count: body.stats?.length ?? 0,
      uploaded: true,
    });
  }),

  // Data snapshots (S3)
  http.get("*/data/teams/:teamId/roster.json", () => {
    return HttpResponse.json({
      team: { id: "t1", name: "Team 1" },
      players: [{ playerId: "p1", name: "Player 1", avatarColor: "red" }],
    });
  }),
  http.get("*/data/teams/:teamId/games.json", () => {
    return HttpResponse.json({
      games: [{ id: "g1", teamId: "t1", opponent: "Opponent", completed: 1 }],
    });
  }),
  http.get("*/data/games/:gameId/stats.json", () => {
    return HttpResponse.json({
      game: { id: "g1", completed: 1 },
      stats: [{ id: "s1", gameId: "g1", type: "FG" }],
    });
  }),
];
