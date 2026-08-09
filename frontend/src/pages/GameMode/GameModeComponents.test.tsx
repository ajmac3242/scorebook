import React from "react";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QuickAction, LineupPlayerButton } from "./GameModeComponents";
import { type Player, type Game, type Team } from "../../db";

const DummyIcon = () => <span data-testid="dummy-icon" />;

describe("QuickAction", () => {
  it("renders correctly with default state", () => {
    const handleClick = vi.fn();
    render(
      <QuickAction
        type="STEAL"
        label="Steal"
        icon={DummyIcon}
        statType={null}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("Steal")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-icon")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Record Steal" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("handles click interaction using userEvent", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <QuickAction
        type="STEAL"
        label="Steal"
        icon={DummyIcon}
        statType={null}
        onClick={handleClick}
      />,
    );

    const button = screen.getByRole("button", { name: "Record Steal" });
    await user.click(button);
    expect(handleClick).toHaveBeenCalledWith("STEAL");
  });

  it("applies active state when statType matches type", () => {
    const handleClick = vi.fn();
    render(
      <QuickAction
        type="STEAL"
        label="Steal"
        icon={DummyIcon}
        statType="STEAL"
        onClick={handleClick}
      />,
    );

    const button = screen.getByRole("button", { name: "Record Steal" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violations", async () => {
    const handleClick = vi.fn();
    const { container } = render(
      <QuickAction
        type="STEAL"
        label="Steal"
        icon={DummyIcon}
        statType={null}
        onClick={handleClick}
      />,
    );
    await assertAccessible(container);
  });
});

describe("LineupPlayerButton", () => {
  const mockPlayer: Player = {
    id: "player-123",
    name: "LeBron James",
    jerseyNumber: "23",
    synced: 0,
  };

  const mockStats = {
    points: 10,
    rebounds: 4,
    fouls: 2,
    assists: 3,
    steals: 1,
    blocks: 1,
    turnovers: 2,
    fgm: 4,
    fga: 8,
    ftm: 2,
    fta: 2,
    tpm: 0,
    tpa: 1,
    sec: 300,
    min: 300,
    fgPct: "50%",
    efgPct: "50%",
  };

  const mockGame: Game = {
    id: "game-123",
    date: "2026-08-08",
    location: "Home",
    completed: 0,
    synced: 0,
    foulLimit: 5,
  };

  const mockTeam: Team = {
    id: "team-123",
    name: "Lakers",
    synced: 0,
    defaultFoulLimit: 5,
    maxStintDuration: 8, // 8 minutes = 480 seconds
    foulWarningThresholds: {
      P1: 2,
    },
  };

  it("renders player info correctly", () => {
    const handleClick = vi.fn();
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120} // 2 mins
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText(/10 pts/i)).toBeInTheDocument();
    expect(screen.getByText(/4 reb/i)).toBeInTheDocument();
    expect(screen.getByText(/2 pf/i)).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument(); // 120 seconds formatted
  });

  it("handles click interaction using userEvent", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);
    expect(handleClick).toHaveBeenCalledWith("player-123");
  });

  it("is disabled when isReadOnly is true", () => {
    const handleClick = vi.fn();
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={true}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("displays hot streak icon 🔥 when streak is HOT", () => {
    const handleClick = vi.fn();
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak="HOT"
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("🔥")).toBeInTheDocument();
  });

  it("displays fatigued alert ⚠️ when stintSecs exceeds maxStintDuration", () => {
    const handleClick = vi.fn();
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={500} // exceeds 8 mins (480 secs)
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("shows OUT chip and has different styling when fouled out", () => {
    const handleClick = vi.fn();
    const fouledOutStats = { ...mockStats, fouls: 5 };
    render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={fouledOutStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );

    expect(screen.getByText("OUT")).toBeInTheDocument();
  });

  it("handles foul warning and period foul warning styling states", () => {
    const handleClick = vi.fn();
    // Foul trouble (pf === foulLimit - 1)
    const foulTroubleStats = { ...mockStats, fouls: 4 };
    const { rerender } = render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={foulTroubleStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );
    expect(screen.getByText("LeBron James")).toBeInTheDocument();

    // Period foul warnings (periodFouls >= threshold)
    rerender(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={3} // exceeds P1 threshold (2)
        streak={undefined}
        onClick={handleClick}
      />,
    );
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const handleClick = vi.fn();
    const { container } = render(
      <LineupPlayerButton
        player={mockPlayer}
        stats={mockStats}
        jerseyNumber="23"
        isReadOnly={false}
        period={1}
        game={mockGame}
        team={mockTeam}
        stintSecs={120}
        periodFouls={0}
        streak={undefined}
        onClick={handleClick}
      />,
    );
    await assertAccessible(container);
  });
});
