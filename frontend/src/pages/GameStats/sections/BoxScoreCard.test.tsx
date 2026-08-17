import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../../test-utils";
import { BoxScoreCard } from "./BoxScoreCard";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { type GameFilters } from "../hooks/useGameFilters";
import { type GameData } from "../hooks/useGameData";

describe("BoxScoreCard", () => {
  const mockAggregates = {
    playerAggregates: [
      {
        id: "p1",
        name: "LeBron James",
        jerseyNumber: "23",
        pts: 25,
        reb: 8,
        ast: 10,
        stl: 2,
        blk: 1,
        turnovers: 3,
        pf: 2,
        fgm: 10,
        fga: 18,
        fg3m: 3,
        fg3a: 7,
        ftm: 2,
        fta: 2,
        plusMinus: 12,
        efficiency: 30,
        min: 32,
      },
    ],
    teamData: {
      pts: 105,
      fgm: 40,
      fga: 80,
      fg3m: 12,
      fg3a: 30,
      ftm: 13,
      fta: 15,
      reb: 42,
      ast: 25,
      stl: 8,
      blk: 4,
      turnovers: 10,
      pf: 15,
    },
    oppData: {
      pts: 98,
      fgm: 36,
      fga: 82,
      fg3m: 10,
      fg3a: 28,
      ftm: 16,
      fta: 20,
      reb: 38,
      ast: 20,
      stl: 5,
      blk: 3,
      turnovers: 12,
      pf: 18,
    },
  } as unknown as GameAggregates;

  const defaultFilters = {
    periodFilter: "ALL",
    sortConfig: { key: "pts", direction: "desc" },
    handleSort: vi.fn(),
  } as unknown as GameFilters;

  const defaultRawData = {
    team: {
      periodType: "QUARTERS",
    },
  } as unknown as GameData;

  it("renders box score without period label when periodFilter is ALL", () => {
    render(
      <BoxScoreCard
        aggregates={mockAggregates}
        filters={defaultFilters}
        rawData={defaultRawData}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Box Score")).toBeDefined();
    expect(screen.getByText("LeBron James")).toBeDefined();
  });

  it("renders Box Score title with Quarter period label when periodFilter is selected and periodType is QUARTERS", () => {
    const filters = {
      ...defaultFilters,
      periodFilter: "2",
    } as unknown as GameFilters;

    render(
      <BoxScoreCard
        aggregates={mockAggregates}
        filters={filters}
        rawData={defaultRawData}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Box Score (Quarter 2)")).toBeDefined();
  });

  it("renders Box Score title with Half period label when periodFilter is selected and periodType is HALVES", () => {
    const filters = {
      ...defaultFilters,
      periodFilter: "1",
    } as unknown as GameFilters;

    const rawData = {
      team: {
        periodType: "HALVES",
      },
    } as unknown as GameData;

    render(
      <BoxScoreCard
        aggregates={mockAggregates}
        filters={filters}
        rawData={rawData}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Box Score (Half 1)")).toBeDefined();
  });

  it("calls onExpand when expand button is clicked", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();

    render(
      <BoxScoreCard
        aggregates={mockAggregates}
        filters={defaultFilters}
        rawData={defaultRawData}
        onExpand={onExpand}
      />,
      { withAuth: false },
    );

    const expandButton = screen.getByRole("button", { name: /expand/i });
    await user.click(expandButton);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <BoxScoreCard
        aggregates={mockAggregates}
        filters={defaultFilters}
        rawData={defaultRawData}
        onExpand={() => {}}
      />,
      { withAuth: false },
    );
    await assertAccessible(container);
  });
});
