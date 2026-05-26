import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchupAnalyticsCard } from "../../pages/GameMode/MatchupAnalyticsCard";

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
});
