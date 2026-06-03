import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LineupEfficiencyCard } from "./LineupEfficiencyCard";
import { CourtSightThemeProvider } from "../../../theme/ThemeContext";

describe("LineupEfficiencyCard", () => {
  const mockAggregates = {
    lineupStats: [
      {
        lineup: ["p1", "p2", "p3", "p4", "p5"],
        seconds: 600,
        pointsFor: 20,
        pointsAgainst: 15,
        netRatingPer40: "20.0",
        netRating: 5,
      },
      {
        lineup: ["p1", "p2", "p3", "p4", "p6"],
        seconds: 300,
        pointsFor: 5,
        pointsAgainst: 10,
        netRatingPer40: "-20.0",
        netRating: -5,
      }
    ],
    shotChartJerseyMap: new Map([
      ["p1", "1"],
      ["p2", "2"],
      ["p3", "3"],
      ["p4", "4"],
      ["p5", "5"],
      ["p6", "6"],
    ]),
  } as unknown as Parameters<typeof LineupEfficiencyCard>[0]["aggregates"];

  it("renders lineup statistics correctly", () => {
    render(
      <CourtSightThemeProvider>
        <LineupEfficiencyCard
          aggregates={mockAggregates}
          onExpand={() => {}}
          onAuditOpen={() => {}}
        />
      </CourtSightThemeProvider>
    );

    expect(screen.getByText("Lineup Efficiency")).toBeDefined();
    // Check for some stat values
    expect(screen.getByText("20.0")).toBeDefined(); // NET/40 of first row
    expect(screen.getByText("+5")).toBeDefined(); // +/- of first row
    expect(screen.getByText("-5")).toBeDefined(); // +/- of second row
  });

  it("calls onExpand when expand button is clicked", () => {
    const onExpand = vi.fn();
    render(
      <CourtSightThemeProvider>
        <LineupEfficiencyCard
          aggregates={mockAggregates}
          onExpand={onExpand}
          onAuditOpen={() => {}}
        />
      </CourtSightThemeProvider>
    );

    // SectionCard expand button is usually an IconButton with an Expand icon
    // StatTable or SectionCard might have its own expand button logic.
    // Based on the code, SectionCard handles onExpand.
    const expandButton = screen.getByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);
    expect(onExpand).toHaveBeenCalled();
  });

  it("calls onAuditOpen when Audit Subs button is clicked", () => {
    const onAuditOpen = vi.fn();
    render(
      <CourtSightThemeProvider>
        <LineupEfficiencyCard
          aggregates={mockAggregates}
          onExpand={() => {}}
          onAuditOpen={onAuditOpen}
        />
      </CourtSightThemeProvider>
    );

    const auditButton = screen.getByText("Audit Subs");
    fireEvent.click(auditButton);
    expect(onAuditOpen).toHaveBeenCalled();
  });
});
