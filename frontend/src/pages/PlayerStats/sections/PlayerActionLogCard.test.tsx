import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders, assertAccessible } from "../../../test-utils";
import PlayerActionLogCard from "./PlayerActionLogCard";
import { screen } from "@testing-library/react";
import { buildGame, buildGameEvent } from "../../../test-factories";

describe("PlayerActionLogCard", () => {
  const mockGames = [
    buildGame({ id: "g1", opponent: "Celtics" }),
    buildGame({ id: "g2", opponent: "Bulls" }),
  ];

  const mockEvents = [
    buildGameEvent({
      gameId: "g1",
      type: "2PT_MADE",
      period: 1,
      clockTime: 510, // 8:30
      locationX: 50,
      locationY: 100,
    }),
    buildGameEvent({
      gameId: "g2",
      type: "FOUL",
      period: 2,
      clockTime: 300, // 5:00
      locationX: undefined,
      locationY: undefined,
    }),
  ];

  it("renders event history correctly", () => {
    renderWithProviders(
      <PlayerActionLogCard filteredEvents={mockEvents} games={mockGames} />,
    );

    expect(screen.getByText("Action Log")).toBeInTheDocument();
    expect(screen.getByText("2PT_MADE")).toBeInTheDocument();
    expect(screen.getByText("Celtics")).toBeInTheDocument();
    expect(screen.getByText("510")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();

    expect(screen.getByText("FOUL")).toBeInTheDocument();
    expect(screen.getByText("Bulls")).toBeInTheDocument();
    expect(screen.getByText("300")).toBeInTheDocument();
  });

  it("renders empty state when no events are provided", () => {
    renderWithProviders(
      <PlayerActionLogCard filteredEvents={[]} games={mockGames} />,
    );

    expect(
      screen.getByText("No actions match the current filters."),
    ).toBeInTheDocument();
  });

  it("uses gameId as fallback if game is not found", () => {
    const unknownEvent = buildGameEvent({ gameId: "g3", type: "STEAL" });
    renderWithProviders(
      <PlayerActionLogCard filteredEvents={[unknownEvent]} games={mockGames} />,
    );

    expect(screen.getByText("g3")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <PlayerActionLogCard filteredEvents={mockEvents} games={mockGames} />,
    );
    await assertAccessible(container);
  });
});
