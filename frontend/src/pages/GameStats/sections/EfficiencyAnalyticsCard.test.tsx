import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../../test-utils";
import { EfficiencyAnalyticsCard } from "./EfficiencyAnalyticsCard";

describe("EfficiencyAnalyticsCard", () => {
  const mockAggregates: any = {
    individualDefensiveBreakdown: [
      { playerName: "Player 1", jerseyNumber: "10", pointsAllowed: 5, primaryReason: "Poor Closeout" },
    ],
    paintTouchStats: { total: 10, pppt: "1.2" },
    teamData: { ppp: "1.0" },
    shotROI: { totalPoints: 50, totalXPts: 45, roi: "0.11" },
    assistNetwork: {
      edges: [{ passerId: "p1", finisherId: "p2", count: 3, points: 6, efg: "60" }],
      primaryPlaymakerId: "p1",
      primaryFinisherId: "p2",
    },
    shotChartJerseyMap: new Map([["p1", "10"], ["p2", "20"]]),
    opponentPlayTypeEfficiency: [
      { type: "Pick and Roll", ppp: "0.85", efg: "45" },
    ],
    shotClockEfficiency: [{ phase: "Early", attempts: 5, points: 10, efg: "50" }],
    processEfficiency: [{ quality: "Good", attempts: 10, points: 12, efg: "60" }],
    playEfficiency: [{ name: "Flow", attempts: 3, points: 6, efg: "100" }],
    defensiveIntegrity: [{ reason: "Rotation", points: 4, percentage: "20" }],
  };

  it("renders multiple sections correctly", () => {
    render(
      <EfficiencyAnalyticsCard
        aggregates={mockAggregates}
        onDefensiveIntegrityOpen={() => {}}
      />
    );

    expect(screen.getByText("Individual Defensive Accountability")).toBeInTheDocument();
    expect(screen.getByText("Rim Pressure (Paint Touches)")).toBeInTheDocument();
    expect(screen.getByText("Process Report (ROI)")).toBeInTheDocument();
    expect(screen.getByText("Assist Network (Chemistry)")).toBeInTheDocument();
    expect(screen.getByText("Opponent Play Types")).toBeInTheDocument();
    expect(screen.getByText("Shot Rhythm (Clock)")).toBeInTheDocument();
    expect(screen.getByText("Process Efficiency")).toBeInTheDocument();
    expect(screen.getByText("Play Efficiency")).toBeInTheDocument();
    expect(screen.getByText("Defensive Integrity")).toBeInTheDocument();
  });

  it("displays paint touch and ROI metrics", () => {
    render(
      <EfficiencyAnalyticsCard
        aggregates={mockAggregates}
        onDefensiveIntegrityOpen={() => {}}
      />
    );

    expect(screen.getByText("TOTAL TOUCHES")).toBeInTheDocument();
    // Multiple 10s exist (touches, jersey, freq), just check it's there
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getByText("PPPT")).toBeInTheDocument();
    expect(screen.getByText("1.2")).toBeInTheDocument();

    expect(screen.getByText("ACTUAL PTS")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("EXPECTED PTS")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    // 11% is displayed as +11% because it is > 0
    expect(screen.getByText("+11%")).toBeInTheDocument();
  });

  it("calls onDefensiveIntegrityOpen when View Report is clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <EfficiencyAnalyticsCard
        aggregates={mockAggregates}
        onDefensiveIntegrityOpen={onOpen}
      />
    );

    const button = screen.getByRole("button", { name: /view report/i });
    await user.click(button);
    expect(onOpen).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <EfficiencyAnalyticsCard
        aggregates={mockAggregates}
        onDefensiveIntegrityOpen={() => {}}
      />
    );
    await assertAccessible(container);
  });
});
