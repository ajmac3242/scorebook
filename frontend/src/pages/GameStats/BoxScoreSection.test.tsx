import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BoxScoreSection } from "./BoxScoreSection";
import {
  type PlayerAggregates,
  type OpponentAggregates,
} from "../../utils/stats";

describe("BoxScoreSection", () => {
  const mockHandleSort = vi.fn();

  const mockPlayerAggregates: PlayerAggregates[] = [
    {
      id: "player-1",
      name: "LeBron James",
      jerseyNumber: "23",
      avatarColor: "#000000",
      min: "32:00",
      points: 28,
      makes: 10,
      attempts: 18,
      fgPct: 55.6,
      efgPct: 61.1,
      offRebounds: 2,
      defRebounds: 6,
      rebounds: 8,
      assists: 10,
      hockeyAssists: 1,
      steals: 2,
      blocks: 1,
      turnovers: 4,
      fouls: 2,
      plusMinus: 12,
      fta: 0,
      ftm: 0,
      p3a: 0,
      p3m: 0,
    },
  ];

  const mockTeamData = {
    ppp: "1.15",
    points: 105,
  };

  const mockOpponentData: OpponentAggregates = {
    ppp: "1.02",
    points: 98,
    makes: 35,
    attempts: 80,
    fgPct: 43.8,
    offRebounds: 10,
    defRebounds: 25,
    rebounds: 35,
    assists: 20,
    steals: 8,
    blocks: 4,
    turnovers: 12,
    fouls: 15,
  };

  const mockSortConfig = {
    key: "points",
    direction: "desc" as const,
  };

  it("renders the box score table with player, team, and opponent rows", async () => {
    const { container } = render(
      <BoxScoreSection
        playerAggregates={mockPlayerAggregates}
        teamData={mockTeamData}
        oppData={mockOpponentData}
        sortConfig={mockSortConfig}
        handleSort={mockHandleSort}
      />,
    );

    // Verify Player Row
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument(); // Jersey number avatar
    expect(screen.getByText("32:00")).toBeInTheDocument(); // Min
    expect(screen.getByText("28")).toBeInTheDocument(); // Points
    expect(screen.getByText("10-18")).toBeInTheDocument(); // FG makes-attempts
    expect(screen.getByText("55.6%")).toBeInTheDocument(); // FG%
    expect(screen.getByText("61.1%")).toBeInTheDocument(); // eFG%
    expect(screen.getByText("+12")).toBeInTheDocument(); // Plus/Minus with '+' sign

    // Verify Team Totals Row
    expect(screen.getByText("TEAM TOTALS (PPP: 1.15)")).toBeInTheDocument();
    expect(screen.getByText("105")).toBeInTheDocument(); // Team total points

    // Verify Opponent Totals Row
    expect(screen.getByText("OPPONENT (PPP: 1.02)")).toBeInTheDocument();
    expect(screen.getByText("98")).toBeInTheDocument(); // Opponent total points
    expect(screen.getByText("35-80")).toBeInTheDocument(); // Opponent FG makes-attempts
    expect(screen.getByText("43.8%")).toBeInTheDocument(); // Opponent FG%

    await assertAccessible(container);
  });

  it("triggers handleSort on clicking a sortable column header", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BoxScoreSection
        playerAggregates={mockPlayerAggregates}
        teamData={mockTeamData}
        oppData={mockOpponentData}
        sortConfig={mockSortConfig}
        handleSort={mockHandleSort}
      />,
    );

    // Get a column header by its text and click it
    const playerHeader = screen.getByText(/PLAYER/);
    await user.click(playerHeader);

    expect(mockHandleSort).toHaveBeenCalledWith("name");

    await assertAccessible(container);
  });
});
