import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClutchPerformanceHUD } from "./ClutchPerformanceHUD";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { PlayerAggregates } from "../utils/stats/types";

const theme = createTheme();

const createMockPlayer = (
  overrides: Partial<PlayerAggregates> = {},
): PlayerAggregates => ({
  id: "p1",
  name: "John Doe",
  jerseyNumber: "10",
  gp: 1,
  gamesPlayed: new Set(["g1"]),
  points: 10,
  rebounds: 5,
  assists: 3,
  hockeyAssists: 0,
  steals: 1,
  turnovers: 2,
  blocks: 1,
  offRebounds: 1,
  defRebounds: 4,
  makes: 4,
  attempts: 8,
  threePM: 1,
  threePA: 3,
  ftm: 1,
  fta: 2,
  fgPct: "50.0",
  threePPct: "33.3",
  ftPct: "50.0",
  efgPct: "56.3",
  tsPct: "56.3",
  plusMinus: 5,
  min: 1200,
  fouls: 2,
  ...overrides,
});

const mockJerseyMap = new Map<string, string | undefined>([
  ["p1", "10"],
  ["p2", "23"],
]);

describe("ClutchPerformanceHUD", () => {
  it("renders correctly with player stats", () => {
    const stats = [
      createMockPlayer({ id: "p1", name: "John Doe" }),
      createMockPlayer({ id: "p2", name: "Jane Smith" }),
    ];
    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD onCourtStats={stats} jerseyMap={mockJerseyMap} />
      </ThemeProvider>,
    );

    expect(screen.getByText(/Winning Time HUD/i)).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("displays clutch advisor warnings for high usage", () => {
    const highUsageStats: PlayerAggregates[] = [
      createMockPlayer({ id: "p1", attempts: 20, turnovers: 5 }),
      createMockPlayer({ id: "p2", attempts: 2, turnovers: 0 }),
    ];

    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD
          onCourtStats={highUsageStats}
          jerseyMap={mockJerseyMap}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByText(/High Usage: Play through #10/),
    ).toBeInTheDocument();
  });

  it("displays clutch advisor warnings for poor FT performers", () => {
    const poorFTStats: PlayerAggregates[] = [
      createMockPlayer({
        id: "p1",
        attempts: 5,
        fta: 10,
        ftm: 2,
        ftPct: "20.0",
      }),
    ];

    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD
          onCourtStats={poorFTStats}
          jerseyMap={mockJerseyMap}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByText(/FT Risk: #10 is a "Hack-a" target/),
    ).toBeInTheDocument();
  });

  it("displays default advisor message when no risks detected", () => {
    // Both players have identical stats, so usage will be exactly 50% each (> 35%)
    // Unless we have more players or zero attempts.
    // Let's use 3 players with equal low attempts. 1/3 = 33.3% (< 35%)
    const stats: PlayerAggregates[] = [
      createMockPlayer({
        id: "p1",
        attempts: 1,
        turnovers: 0,
        fta: 0,
        ftPct: "100.0",
      }),
      createMockPlayer({
        id: "p2",
        attempts: 1,
        turnovers: 0,
        fta: 0,
        ftPct: "100.0",
      }),
      createMockPlayer({
        id: "p3",
        attempts: 1,
        turnovers: 0,
        fta: 0,
        ftPct: "100.0",
      }),
    ];

    const extendedJerseyMap = new Map(mockJerseyMap);
    extendedJerseyMap.set("p3", "5");

    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD
          onCourtStats={stats}
          jerseyMap={extendedJerseyMap}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByText("Maintain current rotation and spread usage."),
    ).toBeInTheDocument();
  });

  it("handles zero total clutch attempts", () => {
    const zeroStats: PlayerAggregates[] = [
      createMockPlayer({ id: "p1", attempts: 0, fta: 0, ftm: 0, turnovers: 0 }),
    ];

    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD
          onCourtStats={zeroStats}
          jerseyMap={mockJerseyMap}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("highlights good FT performers", () => {
    const goodFTStats: PlayerAggregates[] = [
      createMockPlayer({ id: "p1", fta: 5, ftm: 5, ftPct: "100.0" }),
    ];

    render(
      <ThemeProvider theme={theme}>
        <ClutchPerformanceHUD
          onCourtStats={goodFTStats}
          jerseyMap={mockJerseyMap}
        />
      </ThemeProvider>,
    );

    const ftCell = screen.getByText("100.0%");
    const style = window.getComputedStyle(ftCell);
    expect(style.color).not.toBe("");
  });
});
