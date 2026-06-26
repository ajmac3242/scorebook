import React from "react";
import {
  renderWithProviders as render,
  screen,
  act,
} from "../../../test-utils";
import { describe, it, expect, vi } from "vitest";
import PlayerGameLogCard from "./PlayerGameLogCard";
import { StatEvent, Game } from "../../../db";
import { calculatePlayerAggregates } from "../../../utils/stats";

// Mock calculatePlayerAggregates to return predictable values
vi.mock("../../../utils/stats", async () => {
  const actual = await vi.importActual("../../../utils/stats");
  return {
    ...(actual as any),
    calculatePlayerAggregates: vi.fn((_players, stats) => {
      if (stats.length === 0) return [];
      return [
        {
          points: 2,
          rebounds: 1,
          assists: 0,
          steals: 0,
          blocks: 0,
          makes: 1,
          attempts: 1,
          plusMinus: 0,
        },
      ];
    }),
  };
});

describe("PlayerGameLogCard", () => {
  const games: Game[] = [
    {
      id: "g1",
      date: "2024-01-01",
      opponent: "Bulls",
      teamId: "t1",
    } as any,
    {
      id: "g2",
      date: "2024-01-02",
      opponent: "Celtics",
      teamId: "t1",
    } as any,
  ];

  const allStats: StatEvent[] = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: "MAKE",
      points: 2,
    } as any,
  ];

  it("renders empty state when no games", async () => {
    await act(async () => {
      render(<PlayerGameLogCard games={[]} allStats={[]} playerId="p1" />);
    });
    expect(screen.getByText(/no games recorded yet/i)).toBeInTheDocument();
  });

  it("renders games correctly", async () => {
    await act(async () => {
      render(
        <PlayerGameLogCard games={games} allStats={allStats} playerId="p1" />,
      );
    });

    expect(screen.getByText("Bulls")).toBeInTheDocument();
    expect(screen.getByText("Celtics")).toBeInTheDocument();

    // We mocked calculatePlayerAggregates to return 2 pts, 1 reb for any stats
    const bullsRow = screen.getByRole("row", { name: /Bulls/i });
    expect(bullsRow).toHaveTextContent("2"); // PTS
    expect(bullsRow).toHaveTextContent("1"); // REB
  });

  it("handles positive and negative plusMinus for color coverage", async () => {
    vi.mocked(calculatePlayerAggregates).mockReturnValueOnce([
      {
        points: 2,
        rebounds: 1,
        assists: 0,
        steals: 0,
        blocks: 0,
        makes: 1,
        attempts: 1,
        plusMinus: 5,
      } as any,
    ]);
    vi.mocked(calculatePlayerAggregates).mockReturnValueOnce([
      {
        points: 2,
        rebounds: 1,
        assists: 0,
        steals: 0,
        blocks: 0,
        makes: 1,
        attempts: 1,
        plusMinus: -3,
      } as any,
    ]);

    await act(async () => {
      render(
        <PlayerGameLogCard games={games} allStats={allStats} playerId="p1" />,
      );
    });

    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("returns empty rows if no playerId", async () => {
    await act(async () => {
      render(
        <PlayerGameLogCard
          games={games}
          allStats={allStats}
          playerId={undefined}
        />,
      );
    });
    expect(screen.getByText(/no games recorded yet/i)).toBeInTheDocument();
  });

  it("handles missing date and opponent gracefully", async () => {
    const incompleteGames: Game[] = [
      {
        id: "g3",
        teamId: "t1",
      } as any,
    ];
    await act(async () => {
      render(
        <PlayerGameLogCard
          games={incompleteGames}
          allStats={[]}
          playerId="p1"
        />,
      );
    });
    expect(screen.getByText("—")).toBeInTheDocument(); // Date format fallback

    const bodyRows = screen
      .getAllByRole("row")
      .filter((r) => r.closest("tbody"));
    expect(bodyRows[0]).toHaveTextContent("Opponent");
  });
});
