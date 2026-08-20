import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  screen,
  assertAccessible,
} from "../../../test-utils";
import { DefensiveMetricsCard } from "./DefensiveMetricsCard";

describe("DefensiveMetricsCard", () => {
  const mockDefensiveStats = {
    totalStops: 18,
    totalKills: 4,
    currentStreak: 2,
    killEvents: [],
  };

  it("renders defensive metrics KPI stats correctly and passes accessibility", async () => {
    const { container } = renderWithProviders(
      <DefensiveMetricsCard defensiveStats={mockDefensiveStats} />,
      { withAuth: false },
    );

    expect(screen.getByText("Defensive Metrics")).toBeInTheDocument();
    expect(screen.getByText("TOTAL STOPS")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();

    expect(screen.getByText("KILLS (3x STOPS)")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText("CURRENT STOP STREAK")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await assertAccessible(container);
  });
});
