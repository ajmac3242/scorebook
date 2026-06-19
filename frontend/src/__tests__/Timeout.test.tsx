import { renderWithProviders as render, screen, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import GameMode from "../pages/GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import React from "react";
import { ACTION_TYPES } from "../constants/stats";

// Mock BasketballCourt to avoid coordinate calculation issues in JSDOM
vi.mock("../components/game/BasketballCourt", () => ({
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
  const mockPlayers = [
    { id: "p1", name: "Player 1", avatarColor: "#4E7D5B" },
    { id: "p2", name: "Player 2", avatarColor: "#4E7D5B" },
    { id: "p3", name: "Player 3", avatarColor: "#4E7D5B" },
    { id: "p4", name: "Player 4", avatarColor: "#4E7D5B" },
    { id: "p5", name: "Player 5", avatarColor: "#4E7D5B" },
  ];
  const mockStats = mockPlayers.map((p, i) => ({
    id: `s${i}`,
    gameId: "g1",
    playerId: p.id,
    type: ACTION_TYPES.SUB_IN,
    timestamp: new Date().toISOString(),
    period: 1,
    clockTime: 600,
  }));
  const mockTeamPlayers = mockPlayers.map((p, i) => ({
    id: `tp${i}`,
    teamId: "t1",
    playerId: p.id,
    jerseyNumber: (20 + i).toString(),
  }));

  beforeEach(() => {
    mockDb.reset();
    mockDb.seed({
      players: mockPlayers,
      stats: mockStats,
      teamPlayers: mockTeamPlayers,
      games: [
        {
          id: "g1",
          opponent: "Test Opponent",
          date: "2023-01-01",
          teamId: "t1",
          periodType: "QUARTERS",
          completed: 0,
          clockTime: 600,
          currentPeriod: 1,
          periodLength: 10,
        },
      ],
      teams: [
        {
          id: "t1",
          name: "My Team",
          periodType: "QUARTERS",
          defaultTimeoutLimit: 3,
        },
      ],
    });
  });

  const renderComponent = () => render(<GameMode />);

  it("displays initial timeouts correctly (3 dots for each team by default)", async () => {
    renderComponent();
    await screen.findByText(/Live Lineup/i);

    // Each TimeoutDots component has 3 dots by default now.
    const teamDots = screen.getByTestId("team-timeout-dots");
    const oppDots = screen.getByTestId("opp-timeout-dots");

    const teamActive = teamDots.querySelectorAll(
      '[data-testid="timeout-dot-active"]',
    ).length;
    const oppActive = oppDots.querySelectorAll(
      '[data-testid="timeout-dot-active"]',
    ).length;

    expect(teamActive).toBe(3);
    expect(oppActive).toBe(3);
  });

  it("records a TEAM timeout", async () => {
    const user = userEvent.setup();
    renderComponent();
    await screen.findByText(/Live Lineup/i);

    const timeoutBtn = await screen.findByRole("button", { name: /timeout/i });
    await user.click(timeoutBtn);

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.TIMEOUT,
          playerId: "TEAM_TIMEOUT",
        }),
      );
    });
  });

  it("records an OPPONENT timeout when in opponent tracking mode", async () => {
    const user = userEvent.setup();
    renderComponent();
    await screen.findByText(/Live Lineup/i);

    // Switch to Opponent tracking mode
    const oppToggles = await screen.findAllByRole("button", {
      name: /Test Opponent/i,
    });
    const oppToggleBtn = oppToggles.find((el) =>
      el.closest(".MuiToggleButtonGroup-root"),
    );
    await user.click(oppToggleBtn!);

    const timeoutBtn = await screen.findByRole("button", { name: /timeout/i });
    await user.click(timeoutBtn);

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
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
        period: 1,
        clockTime: 500,
      },
      {
        id: "t2",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TIMEOUT,
        timestamp: new Date().toISOString(),
        period: 1,
        clockTime: 400,
      },
      {
        id: "t3",
        gameId: "g1",
        playerId: "OPPONENT",
        type: ACTION_TYPES.TIMEOUT,
        timestamp: new Date().toISOString(),
        period: 1,
        clockTime: 300,
      },
    ];

    mockDb.seed({ stats: statsWithTimeouts });

    renderComponent();
    await screen.findByText(/Live Lineup/i);

    // 3 - 1 = 2 active dots for Team, 3 - 2 = 1 active dots for Opponent
    const teamDots = screen.getByTestId("team-timeout-dots");
    const oppDots = screen.getByTestId("opp-timeout-dots");

    const teamActive = teamDots.querySelectorAll(
      '[data-testid="timeout-dot-active"]',
    ).length;
    const oppActive = oppDots.querySelectorAll(
      '[data-testid="timeout-dot-active"]',
    ).length;

    expect(teamActive).toBe(2);
    expect(oppActive).toBe(1);
  });
});
