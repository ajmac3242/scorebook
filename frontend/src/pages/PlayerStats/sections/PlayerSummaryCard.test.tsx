import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, assertAccessible } from "../../../test-utils";
import PlayerSummaryCard from "./PlayerSummaryCard";
import { screen } from "@testing-library/react";

describe("PlayerSummaryCard", () => {
  const mockAggregates = {
    min: 25.5,
    points: 15,
    rebounds: 8,
    assists: 4,
    steals: 2,
    blocks: 1,
    fgPct: "45.0",
    efgPct: "50.0",
    makes: 6,
    attempts: 13,
    plusMinus: 5,
  };

  const mockTeam = {
    id: "t1",
    name: "Lakers",
    ownerId: "u1",
    periodType: "QUARTERS" as const,
    synced: 1 as const,
  };

  it("renders all summary stats correctly", () => {
    renderWithProviders(
      <PlayerSummaryCard
        aggregates={mockAggregates}
        currentTeam={mockTeam}
        selectedType=""
        selectedGameId=""
        clutchFilter={false}
      />,
    );

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("25.5")).toBeInTheDocument(); // Minutes
    expect(screen.getByText("15")).toBeInTheDocument(); // Points
    expect(screen.getByText("45.0%")).toBeInTheDocument(); // FG%
    expect(screen.getByText("6/13")).toBeInTheDocument(); // FG
    expect(screen.getByText("5")).toBeInTheDocument(); // +/-
  });

  it("renders context information correctly", () => {
    renderWithProviders(
      <PlayerSummaryCard
        aggregates={mockAggregates}
        currentTeam={mockTeam}
        selectedType="2PT"
        selectedGameId="g1"
        clutchFilter={true}
      />,
    );

    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Lakers")).toBeInTheDocument();
    expect(screen.getByText(/2PT · Single game selected · Clutch only/)).toBeInTheDocument();
  });

  it("renders default career context when no team is provided", () => {
    renderWithProviders(
      <PlayerSummaryCard
        aggregates={mockAggregates}
        currentTeam={undefined}
        selectedType=""
        selectedGameId=""
        clutchFilter={false}
      />,
    );

    expect(screen.getByText("Career totals across visible games")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <PlayerSummaryCard
        aggregates={mockAggregates}
        currentTeam={mockTeam}
        selectedType=""
        selectedGameId=""
        clutchFilter={false}
      />,
    );
    await assertAccessible(container);
  });
});
