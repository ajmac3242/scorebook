import { renderWithProviders as render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockDb } from "../dbMock";
import React from "react";
import {
  buildTeam,
  buildGame,
  buildGameEvent,
  buildPlayer,
} from "../test-factories";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    mockDb.reset();
    mockNavigate.mockReset();
  });

  it("renders Dashboard page and empty state when no favorite team exists", async () => {
    render(<Dashboard />);

    expect(await screen.findByText(/Notebook Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to CourtSight!/i)).toBeInTheDocument();
  });

  it("renders dashboard for favorite team and handles game count and heatmap filters", async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().split("T")[0];

    mockDb.seed({
      teams: [
        buildTeam({
          id: "t1",
          name: "Lakers",
          isFavorite: 1,
          primaryColor: "#552583",
          periodType: "QUARTERS",
        }),
      ],
      players: [
        buildPlayer({ id: "p1", name: "LeBron James" }),
        buildPlayer({ id: "p2", name: "Anthony Davis" }),
      ],
      teamPlayers: [
        { id: "tp1", teamId: "t1", playerId: "p1", jerseyNumber: "23", synced: 1 },
        { id: "tp2", teamId: "t1", playerId: "p2", jerseyNumber: "3", synced: 1 },
      ],
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
          time: "19:00",
          location: "Crypto.com Arena",
        }),
      ],
      stats: [
        buildGameEvent({
          id: "s1",
          gameId: "g1",
          type: "MAKE",
          points: 2,
          playerId: "p1",
          period: 1,
          locationX: 25,
          locationY: 15,
        }),
        buildGameEvent({
          id: "s2",
          gameId: "g1",
          type: "SUB_IN",
          playerId: "p1",
          period: 1,
          clockTime: 600,
          timestamp: "2024-01-01T10:00:00Z",
        }),
        buildGameEvent({
          id: "s3",
          gameId: "g1",
          type: "SUB_IN",
          playerId: "p2",
          period: 1,
          clockTime: 600,
          timestamp: "2024-01-01T10:00:00Z",
        }),
        buildGameEvent({
          id: "s4",
          gameId: "g1",
          type: "SUB_OUT",
          playerId: "p1",
          period: 1,
          clockTime: 300,
          timestamp: "2024-01-01T10:05:00Z",
        }),
        buildGameEvent({
          id: "s5",
          gameId: "g1",
          type: "SUB_OUT",
          playerId: "p2",
          period: 1,
          clockTime: 300,
          timestamp: "2024-01-01T10:05:00Z",
        }),
      ],
    });

    render(<Dashboard />);

    expect(await screen.findByText("Lakers")).toBeInTheDocument();
    expect(screen.getByText(/Team Aggregates/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Celtics/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Warriors/i)).toBeInTheDocument();

    // Toggle game count filter L5
    const filterL5 = screen.getByRole("button", { name: "Filter team aggregates to last 5 games" });
    await user.click(filterL5);

    // Toggle game count filter L10
    const filterL10 = screen.getByRole("button", { name: "Filter team aggregates to last 10 games" });
    await user.click(filterL10);

    // Toggle heatmap period filters P1, P2, P3, P4, OT
    const p1Button = screen.getByRole("button", { name: "Filter shot heatmap to Period 1" });
    await user.click(p1Button);

    const p2Button = screen.getByRole("button", { name: "Filter shot heatmap to Period 2" });
    await user.click(p2Button);

    const p3Button = screen.getByRole("button", { name: "Filter shot heatmap to Period 3" });
    await user.click(p3Button);

    const p4Button = screen.getByRole("button", { name: "Filter shot heatmap to Period 4" });
    await user.click(p4Button);

    const otButton = screen.getByRole("button", { name: "Filter shot heatmap to Overtime" });
    await user.click(otButton);

    // Click quick action buttons
    const scheduleNewGameButton = screen.getByRole("button", { name: /Schedule New Game/i });
    await user.click(scheduleNewGameButton);
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    // Click recent results card via Enter key
    const recentCard = screen.getByLabelText(/View stats for game vs Celtics/i);
    await user.type(recentCard, "{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/game/stats?gameId=g1");

    // Click upcoming game card via Space key
    const upcomingCard = screen.getByLabelText(/Upcoming game vs Warriors on/i);
    await user.type(upcomingCard, " ");
    expect(mockNavigate).toHaveBeenCalledWith("/game/stats?gameId=g2");

  });
});
