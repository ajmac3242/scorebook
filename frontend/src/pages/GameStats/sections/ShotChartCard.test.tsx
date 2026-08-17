import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import { ShotChartCard } from "./ShotChartCard";
import { ACTION_TYPES } from "../../../constants/stats";

// Mock BasketballCourt to simplify assertions
vi.mock("../../../components/game/BasketballCourt", () => ({
  default: ({ markers, heatmapData, onMarkerClick }: any) => (
    <div data-testid="basketball-court">
      {markers && <div data-testid="markers-count">{markers.length}</div>}
      {heatmapData && <div data-testid="heatmap-exists">true</div>}
      {markers && markers.length > 0 && (
        <button
          data-testid="marker-click-btn"
          onClick={() => onMarkerClick && onMarkerClick(markers[0])}
        >
          Click Marker
        </button>
      )}
    </div>
  ),
}));

describe("ShotChartCard", () => {
  const mockAggregates: any = {
    shotChartMarkers: [
      { id: "s1", playerId: "p1", type: ACTION_TYPES.MAKE, x: 10, y: 10 },
      { id: "s2", playerId: "p2", type: ACTION_TYPES.MISS, x: 20, y: 20 },
    ],
    heatmapData: [{ x: 50, y: 50, value: 5 }],
    heatmapData1: [{ x: 10, y: 10, value: 2 }],
    heatmapData2: [{ x: 20, y: 20, value: 3 }],
  };

  const mockRawData: any = {
    team: { periodType: "QUARTERS" },
    allStats: [
      { id: "s1", period: 1 },
      { id: "s2", period: 2 },
      { id: "s3", period: 5 }, // Overtime period
    ],
    players: [],
  };

  const mockFilters: any = {
    compareMode: false,
    periodFilter: "ALL",
    shotChartView: "markers",
    shotChartPlayerFilter: "ALL",
    shotChartOutcomeFilter: "ALL",
    shotChartContestFilter: "ALL",
    shotChartBreakdownFilter: "ALL",
    setSelectedPlayerId: vi.fn(),
    setPeriodFilter: vi.fn(),
    setShotChartView: vi.fn(),
    setShotChartPlayerFilter: vi.fn(),
    setShotChartOutcomeFilter: vi.fn(),
    setShotChartContestFilter: vi.fn(),
    setShotChartBreakdownFilter: vi.fn(),
  };

  it("renders shot markers when in markers view", () => {
    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={mockFilters}
        onExpand={() => {}}
      />,
      { withAuth: false },
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
      />,
      { withAuth: false },
    );

    expect(screen.getByTestId("heatmap-exists")).toBeInTheDocument();
  });

  it("triggers setSelectedPlayerId when clicking marker in single-court view", async () => {
    const user = userEvent.setup();
    const setSelectedPlayerId = vi.fn();
    const filters = { ...mockFilters, setSelectedPlayerId };

    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={filters}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    await user.click(screen.getByTestId("marker-click-btn"));
    expect(setSelectedPlayerId).toHaveBeenCalledWith("p1");
  });

  it("renders compare mode with compare period selectors and heatmap data", () => {
    const setComparePeriod1 = vi.fn();
    const setComparePeriod2 = vi.fn();

    const filters = {
      ...mockFilters,
      compareMode: true,
      comparePeriod1: "1",
      comparePeriod2: "2",
      shotChartView: "heatmap",
      setComparePeriod1,
      setComparePeriod2,
    };

    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={filters}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Tactical Comparison")).toBeInTheDocument();
    expect(screen.getAllByTestId("basketball-court")).toHaveLength(2);
    expect(screen.getAllByTestId("heatmap-exists")).toHaveLength(2);
  });

  it("filters markers by period in compare mode when shotChartView is markers", () => {
    const filters = {
      ...mockFilters,
      compareMode: true,
      comparePeriod1: "1",
      comparePeriod2: "2",
      shotChartView: "markers",
      setComparePeriod1: vi.fn(),
      setComparePeriod2: vi.fn(),
    };

    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={filters}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    const markerCounts = screen.getAllByTestId("markers-count");
    expect(markerCounts).toHaveLength(2);
    expect(markerCounts[0]).toHaveTextContent("1");
    expect(markerCounts[1]).toHaveTextContent("1");
  });

  it("renders period title with Half label when periodType is HALVES and periodFilter is active", () => {
    const rawData = {
      ...mockRawData,
      team: { periodType: "HALVES" },
    };
    const filters = {
      ...mockFilters,
      periodFilter: "1",
    };

    render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={rawData}
        filters={filters}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Shot Chart (Half 1)")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ShotChartCard
        aggregates={mockAggregates}
        rawData={mockRawData}
        filters={mockFilters}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );
    await assertAccessible(container);
  });
});
