import { describe, it, expect } from "vitest";

describe("MSW Handlers", () => {
  it("handles GET /user", async () => {
    const res = await fetch("/user");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      userId: "test-user-id",
      email: "test@example.com",
      username: "testuser",
    });
  });

  it("handles GET /api/teams", async () => {
    const res = await fetch("/api/teams");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([{ id: "t1", name: "Team 1", synced: 1 }]);
  });

  it("handles POST /api/teams", async () => {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Team" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ name: "New Team", synced: 1 });
  });

  it("handles GET /api/players", async () => {
    const res = await fetch("/api/players");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([{ id: "p1", name: "Player 1", synced: 1 }]);
  });

  it("handles POST /api/players", async () => {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Player" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ name: "New Player", synced: 1 });
  });

  it("handles POST /api/teams/:teamId/players", async () => {
    const res = await fetch("/api/teams/t1/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Roster Player" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ name: "Roster Player", synced: 1 });
  });

  it("handles POST /api/games", async () => {
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opponent: "Opponent Team" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ opponent: "Opponent Team", synced: 1 });
  });

  it("handles POST /api/games/:gameId/complete", async () => {
    const res = await fetch("/api/games/g1/complete", { method: "POST" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });

  it("handles POST /api/games/:gameId/stats", async () => {
    const res = await fetch("/api/games/g1/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "FG", points: 2 }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ type: "FG", points: 2, synced: 1 });
  });

  it("handles POST /api/stats/bulk", async () => {
    const res = await fetch("/api/stats/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats: [{ type: "FG" }, { type: "FT" }] }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ count: 2, uploaded: true });
  });

  it("handles POST /api/stats/bulk with empty body", async () => {
    const res = await fetch("/api/stats/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ count: 0, uploaded: true });
  });

  it("handles GET /data/teams/:teamId/roster.json", async () => {
    const res = await fetch("/data/teams/t1/roster.json");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      team: { id: "t1", name: "Team 1" },
      players: [{ playerId: "p1", name: "Player 1", avatarColor: "red" }],
    });
  });

  it("handles GET /data/teams/:teamId/games.json", async () => {
    const res = await fetch("/data/teams/t1/games.json");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      games: [{ id: "g1", teamId: "t1", opponent: "Opponent", completed: 1 }],
    });
  });

  it("handles GET /data/games/:gameId/stats.json", async () => {
    const res = await fetch("/data/games/g1/stats.json");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      game: { id: "g1", completed: 1 },
      stats: [{ id: "s1", gameId: "g1", type: "FG" }],
    });
  });
});
