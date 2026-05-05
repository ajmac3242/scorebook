import { render, screen, waitFor } from "@testing-library/react";
import GameMode from "./GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import { ACTION_TYPES } from "../constants/stats";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

vi.mock("../components/BasketballCourt", () => ({
  default: () => <div data-testid="basketball-court">Mock Court</div>,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams("gameId=g1&teamId=t1")],
  };
});

describe("GameMode Metrics", () => {
  const mockPlayers = [
    { id: "p1", name: "Player 1" },
    { id: "p2", name: "Player 2" },
  ];
  const mockTeamPlayers = [
    { teamId: "t1", playerId: "p1", jerseyNumber: "1" },
    { teamId: "t1", playerId: "p2", jerseyNumber: "2" },
  ];
  const mockTeam = {
    id: "t1",
    name: "Team 1",
    periodType: "QUARTERS",
    maxStintDuration: 8,
    fouls: 5,
  };
  const mockGame = {
    id: "g1",
    teamId: "t1",
    currentPeriod: 1,
    clockTime: 400,
    periodLength: 10,
    status: "active",
  };

  beforeEach(() => {
    (globalThis as any).mockDb.reset();
  });

  it("calculates current lineup plus-minus correctly after a sub", async () => {
    const now = new Date();
    const mockStats = [
      {
        id: "s1",
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 600,
        timestamp: new Date(now.getTime() - 10000).toISOString(),
      },
      {
        id: "s2",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.MAKE,
        points: 2,
        period: 1,
        clockTime: 590,
        timestamp: new Date(now.getTime() - 9000).toISOString(),
      },
      {
        id: "s3",
        gameId: "g1",
        playerId: "p2",
        type: ACTION_TYPES.SUB_IN,
        period: 1,
        clockTime: 500,
        timestamp: new Date(now.getTime() - 5000).toISOString(),
      }, // Lineup change here
      {
        id: "s4",
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.MAKE,
        points: 3,
        period: 1,
        clockTime: 450,
        timestamp: new Date(now.getTime() - 1000).toISOString(),
      },
    ];

    (globalThis as any).mockDb.seed({
      teams: [mockTeam],
      players: mockPlayers,
      teamPlayers: mockTeamPlayers,
      games: [mockGame],
      stats: mockStats,
    });

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GameMode />
        </BrowserRouter>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("+3 since sub")).toBeInTheDocument();
    });
  });

  it("triggers fatigue warning based on team settings", async () => {
    (globalThis as any).mockDb.seed({
      teams: [{ ...mockTeam, maxStintDuration: 5 }],
      players: mockPlayers,
      teamPlayers: mockTeamPlayers,
      games: [{ ...mockGame, clockTime: 100 }], // 500s played since 600
      stats: [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ],
    });

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GameMode />
        </BrowserRouter>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("⚠️")).toBeInTheDocument();
    });
  });

  it("displays defensive momentum stats (stops and kills)", async () => {
    const mockStats = [
      {
        id: "s1",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        clockTime: 600,
        timestamp: new Date().toISOString(),
      },
      {
        id: "s2",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        clockTime: 590,
        timestamp: new Date(Date.now() + 1000).toISOString(),
      },
      {
        id: "s3",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TURNOVER,
        period: 1,
        clockTime: 580,
        timestamp: new Date(Date.now() + 2000).toISOString(),
      }, // 3rd stop -> 1st kill
    ];

    (globalThis as any).mockDb.seed({
      teams: [mockTeam],
      players: mockPlayers,
      teamPlayers: mockTeamPlayers,
      games: [mockGame],
      stats: mockStats,
    });

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GameMode />
        </BrowserRouter>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("STOPS")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("KILLS")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });
});
