import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "../../test-utils";
import { Scoreboard, ScoreboardProps } from "./Scoreboard";
import { OpponentThreat } from "../../utils/stats";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

describe("Scoreboard", () => {
  const mockGameData: ScoreboardProps["gameData"] = {
    currentScore: 42,
    opponentScore: 38,
    teamPpp: "1.10",
    oppPpp: "0.95",
    teamFoulStats: {
      teamFouls: 4,
      oppFouls: 5,
      teamBonusLabel: "",
      teamIsDouble: false,
      teamBonusColor: "transparent",
      oppBonusLabel: "BONUS",
      oppIsDouble: false,
      oppBonusColor: "warning",
    },
    timeoutStats: {
      teamTOL: 3,
      oppTOL: 2,
    },
    defensiveStats: {
      totalStops: 15,
      totalKills: 2,
      currentStreak: 1,
    },
    possessionState: null,
    momentumAlerts: {
      opponentRun: null,
      teamRun: null,
      scoringDrought: null,
      opponentThreats: [],
    },
  };

  const defaultProps: ScoreboardProps = {
    game: { opponent: "Rivals" },
    team: { name: "Our Team", periodType: "QUARTERS", defaultTimeoutLimit: 3 },
    gameData: mockGameData,
    period: 1,
    periodLabel: "Quarter",
    maxPeriod: 4,
    isReadOnly: false,
    clockSeconds: 600,
    isClockRunning: false,
    onEditClock: vi.fn(),
  };

  it("renders scores and team names", () => {
    render(<Scoreboard {...defaultProps} />);
    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Rivals")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });

  it("calls onEditClock when clock is clicked", () => {
    render(<Scoreboard {...defaultProps} />);
    const clock = screen.getByLabelText(/Game clock/);
    fireEvent.click(clock);
    expect(defaultProps.onEditClock).toHaveBeenCalled();
  });

  it("calls onEditClock when Enter or Space is pressed on clock", () => {
    render(<Scoreboard {...defaultProps} />);
    const clock = screen.getByLabelText(/Game clock/);
    fireEvent.keyDown(clock, { key: "Enter" });
    expect(defaultProps.onEditClock).toHaveBeenCalled();
    fireEvent.keyDown(clock, { key: " " });
    expect(defaultProps.onEditClock).toHaveBeenCalledTimes(3);
  });

  it("displays possession arrow and indicators", () => {
    const propsWithPossession = {
      ...defaultProps,
      gameData: {
        ...mockGameData,
        possessionArrow: "OUR_TEAM" as const,
        possessionState: SPECIAL_PLAYER_IDS.OUR_TEAM,
      },
    };
    render(<Scoreboard {...propsWithPossession} />);
    expect(screen.getByTestId("ArrowBackIcon")).toBeInTheDocument();
    expect(screen.getByTestId("SportsBasketballIcon")).toBeInTheDocument();
  });

  it("displays momentum alerts", () => {
    const propsWithAlerts = {
      ...defaultProps,
      gameData: {
        ...mockGameData,
        momentumAlerts: {
          opponentRun: "10-0",
          teamRun: "8-0",
          scoringDrought: "3:00",
          opponentThreats: [
            {
              playerId: "OPPONENT:5",
              points: 12,
              straightPoints: 6,
            } as OpponentThreat,
          ],
        },
      },
    };
    render(<Scoreboard {...propsWithAlerts} />);
    expect(screen.getByText(/RUN: 10-0/i)).toBeInTheDocument();
    expect(screen.getByText(/TEAM RUN: 8-0/i)).toBeInTheDocument();
    expect(screen.getByText(/DROUGHT: 3:00/i)).toBeInTheDocument();
    expect(screen.getByText(/THREAT: Opp #5/i)).toBeInTheDocument();
  });

  it("shows overtime label correctly", () => {
    const propsOT = { ...defaultProps, period: 5 };
    render(<Scoreboard {...propsOT} />);
    expect(screen.getByText("OT 1")).toBeInTheDocument();
  });

  it("handles missing game/team names with defaults", () => {
    const propsEmpty = { ...defaultProps, game: null, team: null };
    render(<Scoreboard {...propsEmpty} />);
    expect(screen.getByText("TEAM")).toBeInTheDocument();
    expect(screen.getByText("OPPONENT")).toBeInTheDocument();
  });

  it("shows KILL ACHIEVED overlay when kill count increases", async () => {
    const { rerender } = render(<Scoreboard {...defaultProps} />);

    const propsNewKill = {
      ...defaultProps,
      gameData: {
        ...mockGameData,
        defensiveStats: { ...mockGameData.defensiveStats, totalKills: 3 },
      },
    };

    act(() => {
      rerender(<Scoreboard {...propsNewKill} />);
    });

    expect(screen.getByText("KILL ACHIEVED")).toBeInTheDocument();

    // We can just wait for it to disappear using real timers or just verify it showed up
    await waitFor(
      () => {
        expect(screen.queryByText("KILL ACHIEVED")).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );
  });

  it("renders HALT alerts when provided", () => {
    const propsWithHalt = {
      ...defaultProps,
      haltAlerts: [
        {
          id: "h1",
          message: "DEFENSIVE BREAKDOWN",
          severity: "error" as const,
        },
      ],
    };
    render(<Scoreboard {...propsWithHalt} />);
    expect(screen.getByText("DEFENSIVE BREAKDOWN")).toBeInTheDocument();
  });
});
