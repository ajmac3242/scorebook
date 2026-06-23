import { renderWithProviders as render, screen, waitFor } from "../test-utils";
import GameMode from "./GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import React from "react";
import { ACTION_TYPES } from "../constants/stats";

vi.mock("../components/game/BasketballCourt", () => ({
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
    { id: "p3", name: "Player 3" },
    { id: "p4", name: "Player 4" },
    { id: "p5", name: "Player 5" },
  ];
  const mockTeamPlayers = [
    { teamId: "t1", playerId: "p1", jerseyNumber: "1" },
    { teamId: "t1", playerId: "p2", jerseyNumber: "2" },
    { teamId: "t1", playerId: "p3", jerseyNumber: "3" },
    { teamId: "t1", playerId: "p4", jerseyNumber: "4" },
    { teamId: "t1", playerId: "p5", jerseyNumber: "5" },
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
    mockDb.reset();
  });

  it(
    "calculates current lineup plus-minus correctly after a sub",
    { timeout: 15000 },
    async () => {
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
          id: "s1-2",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(now.getTime() - 10000).toISOString(),
        },
        {
          id: "s1-3",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(now.getTime() - 10000).toISOString(),
        },
        {
          id: "s1-4",
          gameId: "g1",
          playerId: "p5",
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
        },
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

      mockDb.seed({
        teams: [mockTeam],
        players: mockPlayers,
        teamPlayers: mockTeamPlayers,
        games: [mockGame],
        stats: mockStats,
      });

      render(<GameMode />);

      await waitFor(() => {
        expect(screen.getByTestId("lineup-plus-minus")).toHaveTextContent("+3");
      });
    },
  );

  it(
    "triggers fatigue warning based on team settings",
    { timeout: 15000 },
    async () => {
      const fatigueStats = [
        {
          id: "s1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "s2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "s3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "s4",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "s5",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ];
      mockDb.seed({
        teams: [{ ...mockTeam, maxStintDuration: 5 }],
        players: mockPlayers,
        teamPlayers: mockTeamPlayers,
        games: [{ ...mockGame, clockTime: 100 }],
        stats: fatigueStats,
      });

      render(<GameMode />);

      await waitFor(() => {
        // Find one of the fatigue alerts
        expect(screen.getAllByText(/Fatigue Alert/i)[0]).toBeInTheDocument();
      });
    },
  );

  it(
    "displays defensive momentum stats (stops and kills)",
    { timeout: 15000 },
    async () => {
      const momentumStats = [
        {
          id: "s-in-1",
          gameId: "g1",
          playerId: "p1",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date().toISOString(),
        },
        {
          id: "s-in-2",
          gameId: "g1",
          playerId: "p2",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date().toISOString(),
        },
        {
          id: "s-in-3",
          gameId: "g1",
          playerId: "p3",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date().toISOString(),
        },
        {
          id: "s-in-4",
          gameId: "g1",
          playerId: "p4",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date().toISOString(),
        },
        {
          id: "s-in-5",
          gameId: "g1",
          playerId: "p5",
          type: ACTION_TYPES.SUB_IN,
          period: 1,
          clockTime: 600,
          timestamp: new Date().toISOString(),
        },
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
        },
      ];

      mockDb.seed({
        teams: [mockTeam],
        players: mockPlayers,
        teamPlayers: mockTeamPlayers,
        games: [mockGame],
        stats: momentumStats,
      });

      render(<GameMode />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/Total Defensive Stops: 3/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Total Kills: 1/i)).toBeInTheDocument();
      });
    },
  );
});
