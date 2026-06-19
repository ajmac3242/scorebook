import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../../test-utils";
import { LineupEfficiencyCard } from "./LineupEfficiencyCard";

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
      },
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
      <LineupEfficiencyCard
        aggregates={mockAggregates}
        onExpand={() => {}}
        onAuditOpen={() => {}}
      />,
    );

    expect(screen.getByText("Lineup Efficiency")).toBeDefined();
    // Check for some stat values
    expect(screen.getByText("20.0")).toBeDefined(); // NET/40 of first row
    expect(screen.getByText("+5")).toBeDefined(); // +/- of first row
    expect(screen.getByText("-5")).toBeDefined(); // +/- of second row
  });

  it("calls onExpand when expand button is clicked", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <LineupEfficiencyCard
        aggregates={mockAggregates}
        onExpand={onExpand}
        onAuditOpen={() => {}}
      />,
    );

    // SectionCard expand button is usually an IconButton with an Expand icon
    // StatTable or SectionCard might have its own expand button logic.
    // Based on the code, SectionCard handles onExpand.
    const expandButton = screen.getByRole("button", { name: /expand/i });
    await user.click(expandButton);
    expect(onExpand).toHaveBeenCalled();
  });

  it("calls onAuditOpen when Audit Subs button is clicked", async () => {
    const user = userEvent.setup();
    const onAuditOpen = vi.fn();
    render(
      <LineupEfficiencyCard
        aggregates={mockAggregates}
        onExpand={() => {}}
        onAuditOpen={onAuditOpen}
      />,
    );

    const auditButton = screen.getByText("Audit Subs");
    await user.click(auditButton);
    expect(onAuditOpen).toHaveBeenCalled();
  });
});
