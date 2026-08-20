import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { ScoreFlowCard } from "./ScoreFlowCard";
import { ACTION_TYPES } from "../../../constants/stats";

describe("ScoreFlowCard", () => {
  const mockAggregates = {
    scoreFlowData: [
      { time: "00:00", Spread: 0, teamPpp: 0, oppPpp: 0 },
      {
        time: "02:00",
        Spread: 2,
        teamPpp: 1.0,
        oppPpp: 0,
        event: ACTION_TYPES.TIMEOUT,
      },
      { time: "10:00", Spread: 5, teamPpp: 1.2, oppPpp: 0.8 },
    ],
    shotChartJerseyMap: new Map([["p1", "10"]]),
  } as any;

  const mockRawData = {
    game: { id: "g1", periodLength: 10 },
    allStats: [{ period: 2, type: "MAKE" }],
    team: { periodType: "QUARTERS" },
  } as any;

  const defaultProps = {
    aggregates: mockAggregates,
    rawData: mockRawData,
    filters: { periodFilter: "ALL" } as any,
    onExpand: vi.fn(),
  };

  it("renders score flow card with title and passes accessibility", async () => {
    const { container } = renderWithProviders(
      <ScoreFlowCard {...defaultProps} />,
      { withAuth: false },
    );

    expect(screen.getByText("Score Flow")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders period filter label correctly when periodFilter is selected (QUARTERS)", async () => {
    renderWithProviders(
      <ScoreFlowCard
        {...defaultProps}
        filters={{ periodFilter: "1" } as any}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Score Flow (Quarter 1)")).toBeInTheDocument();
  });

  it("renders period filter label correctly when periodFilter is selected (HALVES)", async () => {
    renderWithProviders(
      <ScoreFlowCard
        {...defaultProps}
        rawData={{ ...mockRawData, team: { periodType: "HALVES" } }}
        filters={{ periodFilter: "2" } as any}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Score Flow (Half 2)")).toBeInTheDocument();
  });

  it("triggers onExpand callback when expand button is clicked", async () => {
    const user = userEvent.setup();
    const onExpandMock = vi.fn();

    renderWithProviders(
      <ScoreFlowCard {...defaultProps} onExpand={onExpandMock} />,
      { withAuth: false },
    );

    const expandBtn = screen.getByRole("button", { name: /expand/i });
    await user.click(expandBtn);

    expect(onExpandMock).toHaveBeenCalledTimes(1);
  });
});
