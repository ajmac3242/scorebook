import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GameMode from "../pages/GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { ACTION_TYPES } from "../constants/stats";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

// Mock BasketballCourt to avoid coordinate calculation issues in JSDOM
vi.mock("../components/BasketballCourt", () => ({
  default: ({
    onCoordClick,
  }: {
    onCoordClick: (x: number, y: number) => void;
  }) => (
    <div data-testid="basketball-court" onClick={() => onCoordClick(50, 50)}>
      Mock Basketball Court
    </div>
  ),
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: Record<string, any> = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("gameId=g1&teamId=t1")],
  };
});

describe("GameMode Timeouts", () => {
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const mockStats = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.SUB_IN,
      timestamp: new Date().toISOString(),
    },
  ];
  const mockTeamPlayers = [
    {
      id: "tp1",
      teamId: "t1",
      playerId: "p1",
      jerseyNumber: "23",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("db.stats")) return mockStats;
        if (code.includes("db.games.get"))
          return {
            id: "g1",
            opponent: "Test Opponent",
            date: "2023-01-01",
          };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GameMode />
        </BrowserRouter>
      </ThemeProvider>,
    );

  it("displays initial timeouts correctly (5 dots for each team)", async () => {
    renderComponent();
    await waitFor(() => {
      // Each TimeoutDots component has 5 dots. With 2 teams, total 10 dots.
      const teamDots = screen.getByTestId("team-timeout-dots");
      const oppDots = screen.getByTestId("opp-timeout-dots");

      const teamActive = teamDots.querySelectorAll("[data-testid=\"timeout-dot-active\"]").length;
      const oppActive = oppDots.querySelectorAll("[data-testid=\"timeout-dot-active\"]").length;

      expect(teamActive).toBe(5);
      expect(oppActive).toBe(5);
    });
  });

  it("records a TEAM timeout", async () => {
    renderComponent();

    const timeoutBtn = await screen.findByRole("button", { name: /timeout/i });
    fireEvent.click(timeoutBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.TIMEOUT,
          playerId: "TEAM_TIMEOUT",
        }),
      );
    });
  });

  it("records an OPPONENT timeout when in opponent tracking mode", async () => {
    renderComponent();

    // Switch to Opponent tracking mode
    const oppModeBtn = screen
      .getAllByRole("button", { name: /Opponent/i })
      .find((el) => el instanceof HTMLButtonElement && el.value === "OPPONENT");
    fireEvent.click(oppModeBtn!);

    const timeoutBtn = await screen.findByRole("button", { name: /timeout/i });
    fireEvent.click(timeoutBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.TIMEOUT,
          playerId: "OPPONENT",
        }),
      );
    });
  });

  it("calculates TOL correctly when timeouts are present", async () => {
    // Override mockStats to include some timeouts
    const statsWithTimeouts = [
      ...mockStats,
      {
        id: "t1",
        gameId: "g1",
        playerId: "TEAM_TIMEOUT",
        type: ACTION_TYPES.TIMEOUT,
        timestamp: new Date().toISOString(),
      },
      {
        id: "t2",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TIMEOUT,
        timestamp: new Date().toISOString(),
      },
      {
        id: "t3",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TIMEOUT,
        timestamp: new Date().toISOString(),
      },
    ];

    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("db.stats")) return statsWithTimeouts;
        if (code.includes("db.games.get"))
          return {
            id: "g1",
            opponent: "Test Opponent",
            date: "2023-01-01",
          };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );

    renderComponent();

    await waitFor(() => {
      // 5 - 1 = 4 active dots for Team, 5 - 2 = 3 active dots for Opponent
      const teamDots = screen.getByTestId("team-timeout-dots");
      const oppDots = screen.getByTestId("opp-timeout-dots");

      const teamActive = teamDots.querySelectorAll("[data-testid=\"timeout-dot-active\"]").length;
      const oppActive = oppDots.querySelectorAll("[data-testid=\"timeout-dot-active\"]").length;

      expect(teamActive).toBe(4);
      expect(oppActive).toBe(3);
    });
  });
});
