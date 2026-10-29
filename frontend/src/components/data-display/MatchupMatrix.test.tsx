import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
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
    {
      teamPlayerId: "t1",
      teamPlayerJersey: "1",
      oppPlayerId: "OPPONENT:20",
      oppPlayerJersey: "20",
      stopPct: 35,
      possessions: 4,
    },
    {
      teamPlayerId: "t2",
      teamPlayerJersey: "2",
      oppPlayerId: "OPPONENT:10",
      oppPlayerJersey: "10",
      stopPct: 55,
      possessions: 4,
    },
    {
      teamPlayerId: "t2",
      teamPlayerJersey: "2",
      oppPlayerId: "OPPONENT:20",
      oppPlayerJersey: "20",
      stopPct: 90,
      possessions: 1, // < 3 possessions
    },
  ];

  it("renders the matrix correctly", () => {
    render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
      />,
    );

    expect(
      screen.getByText(/Holistic Matchup Efficiency/i),
    ).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("calls onReassign when a cell is clicked", async () => {
    const user = userEvent.setup();
    const onReassign = vi.fn();
    render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        onReassign={onReassign}
      />,
    );

    const cell = screen.getByText("80%");
    await user.click(cell);

    expect(onReassign).toHaveBeenCalledWith("OPPONENT:10", "t1");
  });

  it("triggers onReassign via Enter and Space keyboard navigation", async () => {
    const user = userEvent.setup();
    const onReassign = vi.fn();
    render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        onReassign={onReassign}
      />,
    );

    const cell = screen.getByText("80%");
    await user.type(cell, "{enter}");
    expect(onReassign).toHaveBeenLastCalledWith("OPPONENT:10", "t1");

    await user.type(cell, " ");
    expect(onReassign).toHaveBeenLastCalledWith("OPPONENT:10", "t1");
  });

  it("handles fallback opponent IDs without colons and empty jersey map", () => {
    render(
      <MatchupMatrix
        teamActiveIds={["t9"]}
        oppActiveIds={["rawid99"]}
        matchupData={[]}
        jerseyMap={new Map()}
      />,
    );

    expect(screen.getAllByText("#??")).toHaveLength(2);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("highlights the currently assigned matchup", () => {
    const currentMatchups = { "OPPONENT:10": "t1" };
    render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        currentMatchups={currentMatchups}
      />,
    );

    const cell = screen.getByText("80%");
    const style = window.getComputedStyle(cell);
    expect(style.border).not.toBe("none");
    expect(style.border).not.toBe("medium none");
  });

  it("displays recommendations when archetype efficiency is high", () => {
    const archetypeEfficiency = {
      t1: { PNR: 70 },
      t2: { PNR: 40 },
    };
    const oppMostFrequentPlayType = {
      "OPPONENT:10": "PNR",
    };

    render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
        archetypeEfficiency={archetypeEfficiency}
        oppMostFrequentPlayType={oppMostFrequentPlayType}
      />,
    );

    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <MatchupMatrix
        teamActiveIds={teamActiveIds}
        oppActiveIds={oppActiveIds}
        matchupData={matchupData}
        jerseyMap={jerseyMap}
      />,
    );

    await assertAccessible(container);
  });
});
