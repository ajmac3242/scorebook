/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders as render, screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import StatsTab from "./StatsTab";
import { PlayerAggregates } from "../../../utils/stats/types";

describe("StatsTab", () => {
  const mockStats: PlayerAggregates[] = [
    {
      id: "p1",
      name: "Player One",
      jerseyNumber: "1",
      gp: 1,
      min: "10:00",
      points: 10,
      threePM: 2,
      threePA: 4,
      threePPct: "50.0",
      fgPct: "50.0",
      efgPct: "60.0",
      rebounds: 5,
      assists: 3,
      steals: 1,
      turnovers: 2,
      plusMinus: 5,
    },
  ];

  const defaultProps = {
    playerStats: mockStats,
    statView: "total" as const,
    setStatView: vi.fn(),
    gameIds: ["g1"],
    teamId: "t1",
    controlRadius: 8,
    sortConfig: { key: "points", direction: "desc" as const },
    handleSort: vi.fn(),
    tokens: {
      semantic: {
        component: {
          sectionCard: {
            radius: 8,
          },
        },
      },
    } as any,
  };

  it("renders stats correctly", () => {
    render(<StatsTab {...defaultProps} />);

    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<StatsTab {...defaultProps} playerStats={[]} />);
    expect(screen.getByText(/No player stats yet/i)).toBeInTheDocument();
  });

  it("calls handleSort when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    render(<StatsTab {...defaultProps} />);

    await user.click(screen.getByText(/PLAYER/));
    expect(defaultProps.handleSort).toHaveBeenCalledWith("name");
  });
});
