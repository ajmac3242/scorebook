import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  assertAccessible,
  screen,
  act,
} from "../../test-utils";
import { Scoreboard } from "./Scoreboard";
import React from "react";

const defaultProps = {
  game: { opponent: "Opponent Team", timeoutLimit: 3 },
  team: { name: "Our Team", periodType: "QUARTERS", defaultTimeoutLimit: 3 },
  gameData: {
    currentScore: 50,
    opponentScore: 48,
    teamPpp: "1.05",
    oppPpp: "1.00",
    teamFoulStats: {
      teamFouls: 3,
      oppFouls: 4,
      teamBonusLabel: "BONUS",
      teamIsDouble: false,
      teamBonusColor: "",
      oppBonusLabel: "BONUS",
      oppIsDouble: false,
      oppBonusColor: "yellow",
    },
    timeoutStats: {
      teamTOL: 2,
      oppTOL: 1,
    },
    defensiveStats: {
      totalStops: 10,
      totalKills: 2,
      currentStreak: 1,
    },
    possessionState: "OUR_TEAM",
    momentumAlerts: {
      opponentRun: "8-0",
      teamRun: "10-0",
      scoringDrought: "3:00",
      opponentThreats: [
        {
          playerId: "OPPONENT:10",
          points: 10,
          makes: 4,
          consecutiveMakes: 2,
          straightPoints: 6,
          isHot: true,
          isClutchThreat: false,
        },
      ],
    },
  },
  period: 2,
  periodLabel: "Quarter",
  maxPeriod: 4,
  isReadOnly: false,
  clockSeconds: 300,
  isClockRunning: true,
};

describe("Scoreboard", () => {
  it("matches snapshot", () => {
    /**
     * This snapshot protects the TV-style scoreboard header's complex layout,
     * including scores, clock, bonus indicators, and momentum alerts.
     */
    const { asFragment } = render(<Scoreboard {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot("Scoreboard - default");
  });

  it("renders scores and team names", async () => {
    const { container } = await act(async () => {
      return render(<Scoreboard {...defaultProps} />);
    });

    await assertAccessible(container);

    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Opponent Team")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders the clock correctly", () => {
    render(<Scoreboard {...defaultProps} />);
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("calls onEditClock when clock is clicked", async () => {
    const user = userEvent.setup();
    const onEditClock = vi.fn();
    await act(async () => {
      render(<Scoreboard {...defaultProps} onEditClock={onEditClock} />);
    });

    const clockDisplay = screen.getByText("5:00");
    await user.click(clockDisplay);
    expect(onEditClock).toHaveBeenCalled();
  });

  it("calls onEditClock when Enter or Space is pressed on clock", async () => {
    const user = userEvent.setup();
    const onEditClock = vi.fn();
    await act(async () => {
      render(<Scoreboard {...defaultProps} onEditClock={onEditClock} />);
    });

    const clockButton = screen.getByRole("button", {
      name: /Game clock: 5:00/i,
    });
    clockButton.focus();
    await user.keyboard("{Enter}");
    expect(onEditClock).toHaveBeenCalledTimes(1);
    await user.keyboard(" ");
    expect(onEditClock).toHaveBeenCalledTimes(2);
    await user.keyboard("a"); // Should not trigger
    expect(onEditClock).toHaveBeenCalledTimes(2);
  });

  it("displays momentum alerts and opponent threats", () => {
    render(<Scoreboard {...defaultProps} />);

    expect(screen.getByText(/RUN: 8-0/)).toBeInTheDocument();
    expect(screen.getByText(/DROUGHT: 3:00/)).toBeInTheDocument();
    expect(
      screen.getByText(/THREAT: Opp #10 has scored 6 STRAIGHT/),
    ).toBeInTheDocument();
  });

  it("displays halt alerts", () => {
    const haltAlerts = [
      {
        id: "alert-1",
        message: "STINT LIMIT REACHED",
        severity: "warning" as const,
        type: "FATIGUE" as const,
      },
    ];
    render(<Scoreboard {...defaultProps} haltAlerts={haltAlerts} />);

    expect(screen.getByText("STINT LIMIT REACHED")).toBeInTheDocument();
  });

  it("renders OT label when period > maxPeriod", () => {
    render(<Scoreboard {...defaultProps} period={5} />);
    expect(screen.getByText("OT 1")).toBeInTheDocument();
  });

  it("renders bonus indicators", () => {
    render(<Scoreboard {...defaultProps} />);
    expect(screen.getByText("BONUS →")).toBeInTheDocument();
    expect(screen.getByText("← BONUS")).toBeInTheDocument();
  });

  it("displays KILL ACHIEVED overlay when kills increase", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Scoreboard {...defaultProps} />);

    const newProps = {
      ...defaultProps,
      gameData: {
        ...defaultProps.gameData,
        defensiveStats: {
          ...defaultProps.gameData.defensiveStats,
          totalKills: 3, // Increased from 2
        },
      },
    };

    await act(async () => {
      rerender(<Scoreboard {...newProps} />);
    });

    expect(screen.getByText("KILL ACHIEVED")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("KILL ACHIEVED")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
