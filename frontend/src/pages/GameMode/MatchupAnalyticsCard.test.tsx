import React from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, act } from "../../test-utils";
import { MatchupAnalyticsCard } from "./MatchupAnalyticsCard";
import { db } from "../../db";
import { vi } from "vitest";

vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

const defaultProps = {
  matchupEfficiency: [],
  showMatchupMatrix: false,
  onToggleMatrix: () => {},
  opponents: [],
  matchups: {},
  jerseyMap: new Map<string, string>(),
  players: [],
  onCourtIds: new Set<string>(),
  gameId: "game-1",
  game: null,
};

describe("MatchupAnalyticsCard", () => {
  it("renders default title", () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByText(/matchup analytics/i)).toBeInTheDocument();
  });

  it("renders toggle button text", () => {
    render(<MatchupAnalyticsCard {...defaultProps} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders target attack recommendation when data is enough", () => {
    const props = {
      ...defaultProps,
      matchupEfficiency: [
        { oppPlayerJersey: "10", stopPct: 30, possessions: 5 },
        { oppPlayerJersey: "20", stopPct: 60, possessions: 5 },
      ],
    };
    render(<MatchupAnalyticsCard {...props} />);
    expect(screen.getByText(/Attack Opponent #10/i)).toBeInTheDocument();
    expect(screen.getByText(/Stop %: 30%/i)).toBeInTheDocument();
  });

  it("renders collecting data message when data is not enough", () => {
    const props = {
      ...defaultProps,
      matchupEfficiency: [
        { oppPlayerJersey: "10", stopPct: 30, possessions: 2 },
      ],
    };
    render(<MatchupAnalyticsCard {...props} />);
    expect(screen.getByText(/Collecting data.../i)).toBeInTheDocument();
  });

  it("renders MatchupMatrix when showMatchupMatrix is true", () => {
    const props = {
      ...defaultProps,
      showMatchupMatrix: true,
      opponents: [{ id: "OPPONENT:10", name: "Opp 10", number: "10" }] as any,
    };
    render(<MatchupAnalyticsCard {...props} />);
    expect(screen.getByText(/Holistic Matchup Efficiency/i)).toBeInTheDocument();
  });

  it("calls onReassign and updates database when a cell is clicked in matrix", async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      showMatchupMatrix: true,
      opponents: [{ id: "OPPONENT:10", name: "Opp 10", number: "10" }] as any,
      matchupEfficiency: [
        {
          teamPlayerId: "t1",
          teamPlayerJersey: "1",
          oppPlayerId: "OPPONENT:10",
          oppPlayerJersey: "10",
          stopPct: 80,
          possessions: 5,
        },
      ] as any,
      matchups: {},
      onCourtIds: new Set(["t1"]),
      jerseyMap: new Map([["t1", "1"]]),
    };

    const updateSpy = vi.spyOn(db.games, "update").mockResolvedValue(1);

    render(<MatchupAnalyticsCard {...props} />);

    const cell = screen.getByText("80%");
    await act(async () => {
      await user.click(cell);
    });

    expect(updateSpy).toHaveBeenCalledWith(
      "game-1",
      expect.objectContaining({
        matchups: { "OPPONENT:10": "t1" },
      }),
    );
  });
});
