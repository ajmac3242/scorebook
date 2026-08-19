import React from "react";
import {
  renderWithProviders,
  screen,
  assertAccessible,
  act,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import StatsTab from "./StatsTab";
import { PlayerAggregates } from "../../../utils/stats/types";
import { describe, it, expect, vi } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("StatsTab", () => {
  const mockPlayerStats: PlayerAggregates[] = [
    {
      id: "p1",
      name: "LeBron James",
      jerseyNumber: "23",
      avatarColor: "#123456",
      gamesPlayed: new Set(["g1", "g2"]),
      gp: 2,
      points: 50,
      rebounds: 16,
      assists: 18,
      hockeyAssists: 3,
      steals: 4,
      turnovers: 5,
      blocks: 2,
      offRebounds: 4,
      defRebounds: 12,
      makes: 20,
      attempts: 35,
      threePM: 6,
      threePA: 12,
      ftm: 4,
      fta: 6,
      fgPct: "57.1",
      threePPct: "50.0",
      ftPct: "66.7",
      efgPct: "65.7",
      tsPct: "66.4",
      plusMinus: 12,
      min: 72,
      fouls: 3,
    },
    {
      id: "p2",
      name: "Anthony Davis",
      jerseyNumber: undefined,
      avatarColor: undefined,
      gamesPlayed: new Set(["g1"]),
      gp: 1,
      points: 25,
      rebounds: 12,
      assists: 3,
      hockeyAssists: 1,
      steals: 2,
      turnovers: 2,
      blocks: 4,
      offRebounds: 3,
      defRebounds: 9,
      makes: 10,
      attempts: 18,
      threePM: 1,
      threePA: 2,
      ftm: 4,
      fta: 5,
      fgPct: "55.6",
      threePPct: "50.0",
      ftPct: "80.0",
      efgPct: "58.3",
      tsPct: "61.9",
      plusMinus: -5,
      min: 36,
      fouls: 2,
    },
  ];

  const defaultProps = {
    playerStats: mockPlayerStats,
    statView: "total" as const,
    setStatView: vi.fn(),
    gameIds: ["g1", "g2"],
    teamId: "team-1",
    sortConfig: { key: "points", direction: "desc" as const },
    handleSort: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders EmptyState when playerStats is empty", () => {
    renderWithProviders(
      <StatsTab {...defaultProps} playerStats={[]} />,
      { withAuth: false },
    );

    expect(screen.getByText("No player stats yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Player performance will appear here once you track completed games for this team.",
      ),
    ).toBeInTheDocument();
  });

  it("renders player stats table and calls setStatView on toggle click", async () => {
    const user = userEvent.setup();
    const setStatView = vi.fn();

    renderWithProviders(
      <StatsTab {...defaultProps} setStatView={setStatView} />,
      { withAuth: false },
    );

    expect(screen.getByText("Player performance")).toBeInTheDocument();
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText("Anthony Davis")).toBeInTheDocument();
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument(); // For Anthony Davis jerseyNumber = undefined

    const averagesButton = screen.getByRole("button", { name: "Averages" });
    await user.click(averagesButton);

    expect(setStatView).toHaveBeenCalledWith("average");
  });

  it("calls handleSort when header is clicked", async () => {
    const user = userEvent.setup();
    const handleSort = vi.fn();

    renderWithProviders(
      <StatsTab {...defaultProps} handleSort={handleSort} />,
      { withAuth: false },
    );

    const ptsHeader = screen.getByText(/PTS/);
    await user.click(ptsHeader);

    expect(handleSort).toHaveBeenCalledWith("points");
  });

  it("navigates to player details page when player row is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<StatsTab {...defaultProps} />, { withAuth: false });

    const lebronRow = screen.getByText("LeBron James").closest("tr");
    expect(lebronRow).not.toBeNull();
    await user.click(lebronRow!);

    expect(mockNavigate).toHaveBeenCalledWith("/players/p1?teamId=team-1");
  });

  it("renders informational notice when gameIds is empty", () => {
    renderWithProviders(
      <StatsTab {...defaultProps} gameIds={[]} />,
      { withAuth: false },
    );

    expect(
      screen.getByText(
        "Stats will populate once you track completed games for this team.",
      ),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(<StatsTab {...defaultProps} />, {
        withAuth: false,
      });
      container = rendered.container;
    });

    await assertAccessible(container!);
  });
});
