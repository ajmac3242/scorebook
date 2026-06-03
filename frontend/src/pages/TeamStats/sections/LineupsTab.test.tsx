import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LineupsTab from "./LineupsTab";
import { CourtSightThemeProvider } from "../../../theme/ThemeContext";

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
      <CourtSightThemeProvider>
        <LineupsTab
          lineupStats={[]}
          localJerseyNumbers={{}}
          sortedRosterJerseyMap={new Map()}
          lineupSortConfig={{ key: "seconds", direction: "desc" }}
          handleLineupSort={vi.fn()}
          controlRadius={8}
        />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText(/No lineup data yet/i)).toBeInTheDocument();
  });

  it("renders lineup table when lineup stats are provided", () => {
    render(
      <CourtSightThemeProvider>
        <LineupsTab
          lineupStats={mockLineupStats}
          localJerseyNumbers={mockLocalJerseyNumbers}
          sortedRosterJerseyMap={new Map()}
          lineupSortConfig={{ key: "seconds", direction: "desc" }}
          handleLineupSort={vi.fn()}
          controlRadius={8}
        />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("10.0")).toBeInTheDocument(); // 600 / 60
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("calls handleLineupSort when a sortable header is clicked", () => {
    const handleLineupSort = vi.fn();
    render(
      <CourtSightThemeProvider>
        <LineupsTab
          lineupStats={mockLineupStats}
          localJerseyNumbers={mockLocalJerseyNumbers}
          sortedRosterJerseyMap={new Map()}
          lineupSortConfig={{ key: "seconds", direction: "desc" }}
          handleLineupSort={handleLineupSort}
          controlRadius={8}
        />
      </CourtSightThemeProvider>,
    );

    const pointsForHeader = screen.getByText(/PTS FOR/);
    fireEvent.click(pointsForHeader);
    expect(handleLineupSort).toHaveBeenCalledWith("pointsFor");
  });
});
