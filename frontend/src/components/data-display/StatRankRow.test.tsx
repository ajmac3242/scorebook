import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import { StatRankRow } from "./StatRankRow";

describe("StatRankRow", () => {
  const kpis = [
    { label: "Points", statKey: "pts" },
    {
      label: "Assists",
      statKey: "ast",
      formatValue: (v: number) => `${v} AST`,
    },
  ];

  const playerStats = { pts: 20, ast: 5 };
  const rosterStats = [
    { pts: 25, ast: 8 },
    { pts: 20, ast: 5 },
    { pts: 15, ast: 2 },
  ];

  it("renders KPI labels, values, and ranks correctly", () => {
    render(
      <StatRankRow
        playerStats={playerStats}
        rosterStats={rosterStats}
        kpis={kpis}
      />,
    );

    // Points KPI assertions
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    // Assists KPI assertions with custom formatter
    expect(screen.getByText("Assists")).toBeInTheDocument();
    expect(screen.getByText("5 AST")).toBeInTheDocument();

    // Both should display "2nd of 3" rank
    expect(screen.getAllByText("2nd of 3")).toHaveLength(2);
  });

  it("handles empty/extreme roster and player edge cases", () => {
    const emptyRoster: Record<string, number>[] = [];
    const { rerender } = render(
      <StatRankRow
        playerStats={{ pts: 10 }}
        rosterStats={emptyRoster}
        kpis={[{ label: "Points", statKey: "pts" }]}
      />,
    );

    // Since total of empty roster is defaulted to 1, rank should display "#1 on team"
    expect(screen.getByText("#1 on team")).toBeInTheDocument();

    // Handles NaN/null/missing playerStats gracefully
    rerender(
      <StatRankRow
        playerStats={{}}
        rosterStats={rosterStats}
        kpis={[{ label: "Points", statKey: "pts" }]}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <StatRankRow
        playerStats={playerStats}
        rosterStats={rosterStats}
        kpis={kpis}
      />,
    );
    await assertAccessible(container);
  });
});
