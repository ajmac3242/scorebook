import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Scoreboard } from "./Scoreboard";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

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
  it("renders scores and team names", () => {
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Opponent Team")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("renders the clock correctly", () => {
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });

  it("calls onEditClock when clock is clicked", () => {
    const onEditClock = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} onEditClock={onEditClock} />
      </ThemeProvider>,
    );

    const clockDisplay = screen.getByText("5:00");
    fireEvent.click(clockDisplay);
    expect(onEditClock).toHaveBeenCalled();
  });

  it("calls onEditClock when Enter or Space is pressed on clock", () => {
    const onEditClock = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} onEditClock={onEditClock} />
      </ThemeProvider>,
    );

    const clockButton = screen.getByRole("button", {
      name: /Game clock: 5:00/i,
    });
    fireEvent.keyDown(clockButton, { key: "Enter" });
    expect(onEditClock).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(clockButton, { key: " " });
    expect(onEditClock).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(clockButton, { key: "a" }); // Should not trigger
    expect(onEditClock).toHaveBeenCalledTimes(2);
  });

  it("displays momentum alerts and opponent threats", () => {
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} />
      </ThemeProvider>,
    );

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
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} haltAlerts={haltAlerts} />
      </ThemeProvider>,
    );

    expect(screen.getByText("STINT LIMIT REACHED")).toBeInTheDocument();
  });

  it("renders OT label when period > maxPeriod", () => {
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} period={5} />
      </ThemeProvider>,
    );
    expect(screen.getByText("OT 1")).toBeInTheDocument();
  });

  it("renders bonus indicators", () => {
    render(
      <ThemeProvider theme={theme}>
        <Scoreboard {...defaultProps} />
      </ThemeProvider>,
    );
    expect(screen.getByText("BONUS →")).toBeInTheDocument();
    expect(screen.getByText("← BONUS")).toBeInTheDocument();
  });
});
