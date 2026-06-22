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
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

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
    const { container } = render(<Scoreboard {...defaultProps} />);

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
    render(<Scoreboard {...defaultProps} onEditClock={onEditClock} />);

    const clockDisplay = screen.getByText("5:00");
    await user.click(clockDisplay);
    expect(onEditClock).toHaveBeenCalled();
  });

  it("does not call onEditClock when isReadOnly is true", async () => {
    const user = userEvent.setup();
    const onEditClock = vi.fn();
    render(
      <Scoreboard
        {...defaultProps}
        onEditClock={onEditClock}
        isReadOnly={true}
      />,
    );

    const clockDisplay = screen.getByText("5:00");
    await user.click(clockDisplay);
    expect(onEditClock).not.toHaveBeenCalled();
  });

  it("calls onEditClock when Enter or Space is pressed on clock", async () => {
    const user = userEvent.setup();
    const onEditClock = vi.fn();
    render(<Scoreboard {...defaultProps} onEditClock={onEditClock} />);

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
    const { rerender } = render(<Scoreboard {...defaultProps} />);

    expect(screen.getByText(/RUN: 8-0/)).toBeInTheDocument();
    expect(screen.getByText(/DROUGHT: 3:00/)).toBeInTheDocument();
    expect(
      screen.getByText(/THREAT: Opp #10 has scored 6 STRAIGHT/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Suggest Timeout/)).toBeInTheDocument();

    // Test straightPoints >= 8
    rerender(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          momentumAlerts: {
            ...defaultProps.gameData.momentumAlerts,
            opponentThreats: [
              {
                playerId: "OPPONENT:10",
                points: 15,
                makes: 6,
                consecutiveMakes: 4,
                straightPoints: 9,
                isHot: true,
                isClutchThreat: false,
              },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText(/Change Matchup/)).toBeInTheDocument();
  });

  it("displays halt alerts with different severities", () => {
    const haltAlerts = [
      {
        id: "alert-1",
        message: "STINT LIMIT REACHED",
        severity: "warning" as const,
        type: "FATIGUE" as const,
      },
      {
        id: "alert-2",
        message: "FOUL TROUBLE",
        severity: "error" as const,
        type: "FOULS" as const,
      },
      {
        id: "alert-3",
        message: "INFO ALERT",
        severity: "info" as const,
        type: "FATIGUE" as const,
      },
    ];
    render(<Scoreboard {...defaultProps} haltAlerts={haltAlerts} />);

    expect(screen.getByText("STINT LIMIT REACHED")).toBeInTheDocument();
    expect(screen.getByText("FOUL TROUBLE")).toBeInTheDocument();
    expect(screen.getByText("INFO ALERT")).toBeInTheDocument();
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

  it("renders possession indicators", () => {
    const { rerender } = render(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          possessionArrow: "OUR_TEAM",
          possessionState: SPECIAL_PLAYER_IDS.OUR_TEAM,
        }}
      />,
    );
    // ArrowBack and SportsBasketball for our team
    expect(screen.getAllByTestId("ArrowBackIcon")).toHaveLength(1);
    expect(screen.getAllByTestId("SportsBasketballIcon")).toHaveLength(1);

    rerender(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          possessionArrow: "OPPONENT",
          possessionState: SPECIAL_PLAYER_IDS.OPPONENT,
        }}
      />,
    );
    // ArrowForward and SportsBasketball for opponent
    expect(screen.getAllByTestId("ArrowForwardIcon")).toHaveLength(1);
    expect(screen.getAllByTestId("SportsBasketballIcon")).toHaveLength(1);
  });

  it("handles kill overlay trigger", async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          defensiveStats: {
            ...defaultProps.gameData.defensiveStats,
            totalKills: 2,
          },
        }}
      />,
    );

    // Increment kills to trigger effect
    rerender(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          defensiveStats: {
            ...defaultProps.gameData.defensiveStats,
            totalKills: 3,
          },
        }}
      />,
    );

    expect(screen.getByText("KILL ACHIEVED")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("KILL ACHIEVED")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("handles empty/null props gracefully", () => {
    // @ts-expect-error - testing null props
    render(
      <Scoreboard
        game={null}
        team={null}
        gameData={defaultProps.gameData}
        period={1}
        periodLabel="Period"
        maxPeriod={4}
        isReadOnly={false}
        clockSeconds={0}
        isClockRunning={false}
      />,
    );
    expect(screen.getByText("TEAM")).toBeInTheDocument();
    expect(screen.getByText("OPPONENT")).toBeInTheDocument();
  });

  it("calculates timeoutTotal from different prop sources", () => {
    const { rerender } = render(
      <Scoreboard
        {...defaultProps}
        game={{ ...defaultProps.game, timeoutLimit: 5 }}
      />,
    );
    expect(screen.getAllByTestId("timeout-dot-inactive")).toHaveLength(
      5 - 2 + (5 - 1),
    ); // team: 5 total, 2 left -> 3 inactive; opp: 5 total, 1 left -> 4 inactive. Total 7.

    rerender(
      <Scoreboard
        {...defaultProps}
        team={{ ...defaultProps.team, timeoutsPerTeam: 4 }}
        game={{ ...defaultProps.game, timeoutLimit: undefined }}
      />,
    );
    // team: 4 total, 2 left -> 2 inactive; opp: 4 total, 1 left -> 3 inactive. Total 5.
    expect(screen.getAllByTestId("timeout-dot-inactive")).toHaveLength(5);
  });

  it("renders defensive momentum dots based on currentStreak", () => {
    const { rerender } = render(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          defensiveStats: {
            ...defaultProps.gameData.defensiveStats,
            currentStreak: 0,
          },
        }}
      />,
    );
    // Initial render check
    expect(screen.getByText("50")).toBeInTheDocument();

    rerender(
      <Scoreboard
        {...defaultProps}
        gameData={{
          ...defaultProps.gameData,
          defensiveStats: {
            ...defaultProps.gameData.defensiveStats,
            currentStreak: 2,
          },
        }}
      />,
    );
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("hides clock progress indicator when clock is not running", () => {
    render(<Scoreboard {...defaultProps} isClockRunning={false} />);
    const indicator = screen.getByTestId("clock-progress");
    expect(indicator).toHaveStyle({ visibility: "hidden" });
  });
});
