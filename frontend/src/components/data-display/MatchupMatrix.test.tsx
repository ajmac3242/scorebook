import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen, fireEvent } from "../../test-utils";
import { MatchupMatrix } from "./MatchupMatrix";
import React from "react";

describe("MatchupMatrix", () => {
  const teamActiveIds = ["t1", "t2"];
  const oppActiveIds = ["OPPONENT:10", "OPPONENT:20"];
  const jerseyMap = new Map([
    ["t1", "1"],
    ["t2", "2"],
  ]);
  const matchupData = [
    {
      teamPlayerId: "t1",
      teamPlayerJersey: "1",
      oppPlayerId: "OPPONENT:10",
      oppPlayerJersey: "10",
      stopPct: 80,
      possessions: 5,
    },
  ];

  it("renders the matrix correctly", () => {
    render(<MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
      />);

    expect(
      screen.getByText(/Holistic Matchup Efficiency/i),
    ).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("calls onReassign when a cell is clicked", () => {
    const onReassign = vi.fn();
    render(<MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        onReassign={onReassign}
      />);

    const cell = screen.getByText("80%");
    fireEvent.click(cell);

    expect(onReassign).toHaveBeenCalledWith("OPPONENT:10", "t1");
  });

  it("highlights the currently assigned matchup", () => {
    const currentMatchups = { "OPPONENT:10": "t1" };
    render(<MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        currentMatchups={currentMatchups}
      />);

    const cell = screen.getByText("80%");
    // Assigned cells have a specific background color and border
    // Since theme variables are hard to test in JSDOM, we verify that the border property exists
    // and is not 'none' or 'medium none'.
    const style = window.getComputedStyle(cell);
    expect(style.border).not.toBe("none");
    expect(style.border).not.toBe("medium none");
  });
});
