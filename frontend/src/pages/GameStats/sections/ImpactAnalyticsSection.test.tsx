import { renderWithProviders as render, screen } from "../../../test-utils";
import { ImpactAnalyticsSection } from "./ImpactAnalyticsSection";
import { describe, it, expect } from "vitest";

describe("ImpactAnalyticsSection", () => {
  const mockOnOffStats = [
    {
      playerId: "p1",
      name: "Player 1",
      on: {
        offRating: "110.0",
        defRating: "105.0",
        netRating: "5.0",
      },
      off: {
        offRating: "100.0",
        defRating: "115.0",
        netRating: "-15.0",
      },
      differential: "20.0",
    },
  ];

  const mockMatchupStats = [
    {
      opponentJersey: "23",
      defenderName: "Defender A",
      pointsAllowed: 12,
      stops: 4,
      stopPct: "25.0",
    },
  ];

  const mockPlayers = [{ id: "p1", name: "Player 1" }] as any;

  it("renders both analytics tables", () => {
    render(
      <ImpactAnalyticsSection
        onOffStats={mockOnOffStats as any}
        matchupStats={mockMatchupStats as any}
        players={mockPlayers}
      />,
    );

    expect(screen.getByText("Team Impact Analytics (On/Off)")).toBeInTheDocument();
    expect(screen.getByText("Matchup Accountability (Points Allowed)")).toBeInTheDocument();

    // Check for On/Off data
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument(); // formatPlusMinus might be stripping .0

    // Check for Matchup data
    expect(screen.getByText("Opponent #23")).toBeInTheDocument();
    expect(screen.getByText("Defender A")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });

  it("renders empty state for matchup table when no data", () => {
    render(
      <ImpactAnalyticsSection
        onOffStats={[]}
        matchupStats={[]}
        players={[]}
      />,
    );

    expect(screen.getByText("No matchup data recorded.")).toBeInTheDocument();
  });
});
