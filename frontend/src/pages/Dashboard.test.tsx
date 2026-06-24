import { renderWithProviders as render, screen } from "../test-utils";
import Dashboard from "./Dashboard";
import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import React from "react";
import { buildTeam, buildGame, buildGameEvent } from "../test-factories";

describe("Dashboard Component", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("renders Dashboard page and empty state", async () => {
    render(<Dashboard />);

    expect(await screen.findByText(/Notebook Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to CourtSight!/i)).toBeInTheDocument();
  });

  it("renders dashboard for favorite team", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockDb.seed({
      teams: [buildTeam({ id: "t1", name: "Lakers", isFavorite: 1 })],
      games: [
        buildGame({
          id: "g1",
          teamId: "t1",
          opponent: "Celtics",
          completed: 1,
          date: "2024-01-01",
        }),
        buildGame({
          id: "g2",
          teamId: "t1",
          opponent: "Warriors",
          completed: 0,
          date: today,
        }),
      ],
      stats: [
        buildGameEvent({
          id: "s1",
          gameId: "g1",
          type: "MAKE",
          points: 2,
          playerId: "p1",
        }),
      ],
    });

    render(<Dashboard />);

    expect(await screen.findByText("Lakers")).toBeInTheDocument();
    expect(screen.getByText(/Team Aggregates/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Celtics/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Warriors/i)).toBeInTheDocument();
  });
});
