import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { PlayerPerformancePanel } from "./PlayerPerformancePanel";
import type { PlayerAggregates } from "../../../utils/stats";

describe("PlayerPerformancePanel", () => {
  const mockSortedStatsGridData: PlayerAggregates[] = [
    {
      id: "p1",
      name: "Player One",
      points: 12,
      fgPct: "50.0",
      assists: 4,
      rebounds: 6,
      fouls: 4,
    } as any,
    {
      id: "p2",
      name: "Player Zero",
      points: 8,
      fgPct: "40.0",
      assists: 2,
      rebounds: 3,
      fouls: 1,
    } as any,
  ];

  const mockJerseyMap = new Map<string, string>([
    ["p1", "10"],
    ["p2", "0"],
  ]);

  const defaultProps = {
    sortedStatsGridData: mockSortedStatsGridData,
    sortConfig: { key: "points" as const, direction: "desc" as const },
    onSortChange: vi.fn(),
    jerseyMap: mockJerseyMap,
    draftOnCourtIds: new Set(["p1"]),
    chainPrompt: null,
    playbookEfficiency: null,
    gameId: "g1",
    period: 1,
    clockSeconds: 600,
    isReadOnly: false,
    gameStats: [],
  };

  it("renders player performance table and checks accessibility", async () => {
    const { container } = renderWithProviders(
      <PlayerPerformancePanel {...defaultProps} />,
      { withAuth: false },
    );

    expect(screen.getByText("Player Performance")).toBeInTheDocument();
    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // Jersey 10
    expect(screen.getByText("Player Zero")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument(); // Jersey 0 formatted with ??

    await assertAccessible(container);
  });

  it("triggers onSortChange when column sort header is clicked", async () => {
    const user = userEvent.setup();
    const onSortChangeMock = vi.fn();

    renderWithProviders(
      <PlayerPerformancePanel
        {...defaultProps}
        onSortChange={onSortChangeMock}
      />,
      { withAuth: false },
    );

    const ptsHeaderBtn = screen.getByRole("button", { name: /^PTS/ });
    await user.click(ptsHeaderBtn);

    expect(onSortChangeMock).toHaveBeenCalledWith("points");
  });

  it("renders chain prompt banner when active and not in read-only mode", async () => {
    renderWithProviders(
      <PlayerPerformancePanel
        {...defaultProps}
        chainPrompt={{
          type: "REBOUND",
          originalStat: { period: 1, clockTime: 600, timestamp: "100" },
        }}
        isReadOnly={false}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("WHO GOT THE REBOUND?")).toBeInTheDocument();
  });

  it("does not render chain prompt banner when in read-only mode", async () => {
    renderWithProviders(
      <PlayerPerformancePanel
        {...defaultProps}
        chainPrompt={{
          type: "REBOUND",
          originalStat: { period: 1, clockTime: 600, timestamp: "100" },
        }}
        isReadOnly={true}
      />,
      { withAuth: false },
    );

    expect(screen.queryByText("WHO GOT THE REBOUND?")).not.toBeInTheDocument();
  });

  it("renders playbook efficiency widget when playbookEfficiency prop is provided", async () => {
    renderWithProviders(
      <PlayerPerformancePanel
        {...defaultProps}
        playbookEfficiency={{ teamPpp: 1.1, opponentPpp: 0.9 } as any}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Playbook Efficiency")).toBeInTheDocument();
    expect(screen.getByText("No plays tagged yet")).toBeInTheDocument();
  });
});
