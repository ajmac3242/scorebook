import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen, assertAccessible } from "../../../test-utils";
import { ShotChartCard } from "./ShotChartCard";
import { ACTION_TYPES } from "../../../constants/stats";

// Mock BasketballCourt to simplify assertions
vi.mock("../../../components/game/BasketballCourt", () => ({
  default: ({ markers, heatmapData }: any) => (
    <div data-testid="basketball-court">
      {markers && <div data-testid="markers-count">{markers.length}</div>}
      {heatmapData && <div data-testid="heatmap-exists">true</div>}
    </div>
  ),
}));

describe("ShotChartCard", () => {
  const mockAggregates: any = {
    shotChartMarkers: [
      { id: "s1", playerId: "p1", type: ACTION_TYPES.MAKE, x: 10, y: 10 },
      { id: "s2", playerId: "p2", type: ACTION_TYPES.MISS, x: 20, y: 20 },
    ],
    heatmapData: [],
    heatmapData1: [],
    heatmapData2: [],
  };

  const mockRawData: any = {
    team: { periodType: "QUARTERS" },
    allStats: [
      { id: "s1", period: 1 },
      { id: "s2", period: 2 },
    ],
    players: [],
  };

  const mockFilters: any = {
    compareMode: false,
    periodFilter: "ALL",
    shotChartView: "markers",
    setSelectedPlayerId: vi.fn(),
    setPeriodFilter: vi.fn(),
    setShotChartView: vi.fn(),
  };

  it("renders shot markers when in markers view", () => {
    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={mockFilters}
        onExpand={() => {}}
      />
    );

    expect(screen.getByText("Shot Chart")).toBeInTheDocument();
    expect(screen.getByTestId("markers-count")).toHaveTextContent("2");
  });

  it("renders heatmap when in heatmap view", () => {
    const filters = { ...mockFilters, shotChartView: "heatmap" };
    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={filters}
        onExpand={() => {}}
      />
    );

    expect(screen.getByTestId("heatmap-exists")).toBeInTheDocument();
  });

  it("renders compare mode correctly", () => {
    const filters = {
      ...mockFilters,
      compareMode: true,
      comparePeriod1: "1",
      comparePeriod2: "2",
      setComparePeriod1: vi.fn(),
      setComparePeriod2: vi.fn(),
    };
    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={filters}
        onExpand={() => {}}
      />
    );

    expect(screen.getByText("Tactical Comparison")).toBeInTheDocument();
    expect(screen.getAllByTestId("basketball-court")).toHaveLength(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={mockFilters}
        onExpand={() => {}}
      />
    );
    await assertAccessible(container);
  });
});
