import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import LineupsTab from "./LineupsTab";

const mockLineupStats = [
  {
    lineup: ["p1", "p2", "p3", "p4", "p5"],
    seconds: 600,
    pointsFor: 25,
    pointsAgainst: 20,
    netRating: 5,
    netRatingPer40: "15",
  },
] as unknown as Parameters<typeof LineupsTab>[0]["lineupStats"];

const mockLocalJerseyNumbers = {
  p1: "1",
  p2: "2",
  p3: "3",
  p4: "4",
  p5: "5",
};

describe("LineupsTab", () => {
  it("renders empty state when no lineup stats are provided", () => {
    render(
      <LineupsTab
        lineupStats={[]}
        localJerseyNumbers={{}}
        sortedRosterJerseyMap={new Map()}
        lineupSortConfig={{ key: "seconds", direction: "desc" }}
        handleLineupSort={vi.fn()}
      />,
      { withAuth: false },
    );

    expect(screen.getByText(/No lineup data yet/i)).toBeInTheDocument();
  });

  it("renders lineup table when lineup stats are provided", () => {
    render(
      <LineupsTab
        lineupStats={mockLineupStats}
        localJerseyNumbers={mockLocalJerseyNumbers}
        sortedRosterJerseyMap={new Map()}
        lineupSortConfig={{ key: "seconds", direction: "desc" }}
        handleLineupSort={vi.fn()}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("10.0")).toBeInTheDocument(); // 600 / 60
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("calls handleLineupSort when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    const handleLineupSort = vi.fn();
    render(
      <LineupsTab
        lineupStats={mockLineupStats}
        localJerseyNumbers={mockLocalJerseyNumbers}
        sortedRosterJerseyMap={new Map()}
        lineupSortConfig={{ key: "seconds", direction: "desc" }}
        handleLineupSort={handleLineupSort}
      />,
      { withAuth: false },
    );

    const pointsForHeader = screen.getByText(/PTS FOR/);
    await user.click(pointsForHeader);
    expect(handleLineupSort).toHaveBeenCalledWith("pointsFor");
  });

  it("renders different net ratings (negative, zero) and missing jersey fallbacks", () => {
    const mixedLineupStats = [
      {
        lineup: ["p1", "p2", "p3", "p4", "p99"], // p99 doesn't have a jersey mapped
        seconds: 300,
        pointsFor: 10,
        pointsAgainst: 15,
        netRating: -5,
        netRatingPer40: "-40",
      },
      {
        lineup: ["p1", "p2", "p3", "p4", "p5"],
        seconds: 300,
        pointsFor: 12,
        pointsAgainst: 12,
        netRating: 0,
        netRatingPer40: "0",
      },
    ] as unknown as Parameters<typeof LineupsTab>[0]["lineupStats"];

    const sortedMap = new Map<string, string>([["p5", "5"]]);

    render(
      <LineupsTab
        lineupStats={mixedLineupStats}
        localJerseyNumbers={{ p1: "1", p2: "2", p3: "3", p4: "4" }} // p5 and p99 are omitted on purpose
        sortedRosterJerseyMap={sortedMap}
        lineupSortConfig={{ key: "seconds", direction: "desc" }}
        handleLineupSort={vi.fn()}
      />,
      { withAuth: false },
    );

    // Verify negative net rating doesn't have positive prefix
    expect(screen.getByText("-5")).toBeInTheDocument();
    // Verify zero net rating has no prefix (matches both netRating and netRatingPer40 of 0)
    expect(screen.getAllByText("0")).toHaveLength(2);
    // Verify missing jersey number for p99 falls back to "??"
    expect(screen.getByText("??")).toBeInTheDocument();
    // Verify player p5 has jersey "5" from sortedRosterJerseyMap
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LineupsTab
        lineupStats={mockLineupStats}
        localJerseyNumbers={mockLocalJerseyNumbers}
        sortedRosterJerseyMap={new Map()}
        lineupSortConfig={{ key: "seconds", direction: "desc" }}
        handleLineupSort={vi.fn()}
      />,
      { withAuth: false },
    );

    await assertAccessible(container);
  });
});
