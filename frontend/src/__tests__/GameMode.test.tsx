/**
 * @file GameMode.test.tsx
 * @description Integration tests for the GameMode page.
 *
 * These tests verify end-to-end workflows including stat recording,
 * lineup management, possession tracking, and coach board interactions.
 *
 * Sub-component unit tests live in __tests__/GameMode/ (e.g. VoiceModeBanner,
 * TrackingModeToolbar, CourtMarkerFilters, LiveLineupCard, SparkPlugTable,
 * DefensiveSchemeSelector, MatchupAnalyticsCard, OffensiveKPICard).
 */
import {
  renderWithProviders as render,
  screen,
  within,
  waitFor,
  act,
} from "../test-utils";
import GameMode from "../pages/GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";

// Mock BasketballCourt to avoid coordinate calculation issues in JSDOM
vi.mock("../components/game/BasketballCourt", () => ({
  default: ({ onCoordClick }: any) => (
    <div
      data-testid="basketball-court"
      onClick={(e) => {
        const x = Number(e.currentTarget.getAttribute("data-x") || 50);
        const y = Number(e.currentTarget.getAttribute("data-y") || 50);
        onCoordClick(x, y);
      }}
    >
      Mock Basketball Court
    </div>
  ),
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: Record<string, any> = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("gameId=g1&teamId=t1")],
  };
});

describe("GameMode Component", () => {
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const now = new Date();
  const mockStats = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      timestamp: now.toISOString(),
      period: 1,
      clockTime: 600,
    },
    {
      id: "s2",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.SUB_IN,
      timestamp: new Date(now.getTime() - 1000).toISOString(),
      period: 1,
      clockTime: 600,
    },
  ];
  const mockTeamPlayers = [
    {
      id: "tp1",
      teamId: "t1",
      playerId: "p1",
      jerseyNumber: "23",
      name: "Player 1",
    },
  ];

  beforeEach(() => {
    mockDb.reset();
    mockDb.seed({
      players: mockPlayers,
      stats: mockStats,
      teamPlayers: mockTeamPlayers,
      games: [
        {
          id: "g1",
          opponent: "Test Opponent",
          date: "2023-01-01",
          teamId: "t1",
          periodType: "QUARTERS",
          completed: 0,
          clockTime: 600,
          currentPeriod: 1,
          periodLength: 10,
        },
      ],
      teams: [
        {
          id: "t1",
          name: "My Team",
          periodType: "QUARTERS",
        },
      ],
    });
  });

  const renderComponent = () => render(<GameMode />);

  it("renders GameMode page and displays players/stats", async () => {
    renderComponent();

    const opps = await screen.findAllByText(/Test Opponent/i);
    expect(opps.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Live Lineup/i)).toBeInTheDocument();
    // Verify player appears in the stats table
    const table = await screen.findByRole("table", {
      name: /Player stats/i,
    });
    // PlayerStatRow might truncate or split name
    expect(within(table).getByText(/Player/i)).toBeInTheDocument();
  });

  it("records a MAKE stat (updated workflow)", async () => {
    const { user } = renderComponent();

    // Click court
    await user.click(screen.getByTestId("basketball-court"));

    // Action dialog should open
    expect(await screen.findByTestId("stat-dialog")).toBeInTheDocument();

    // Select Player 1 by jersey number
    const dialog = screen.getByTestId("stat-dialog");
    const playerBtn = await within(dialog).findByRole("button", {
      name: "23",
    });
    await user.click(playerBtn);

    // Select "Make"
    const makeBtn = within(dialog).getByLabelText(/Record Make/i);
    await user.click(makeBtn);

    // Click Save
    const saveBtn = within(dialog).getByText(/Save/i);
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.MAKE,
          playerId: "p1",
          points: 2,
        }),
      );
    });
  });

  it("undoes the last stat", async () => {
    const { user } = renderComponent();

    // Wait for stats to load so button is enabled
    const undoBtn = await screen.findByRole("button", { name: /Undo/i });

    await waitFor(() => {
      expect(undoBtn).not.toBeDisabled();
    });

    await user.click(undoBtn);

    await waitFor(() => {
      expect(mockDb.stats.update).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({
          synced: 0,
        }),
      );
    });
  });

  it("records a Foul stat (updated workflow)", async () => {
    const { user } = renderComponent();

    await user.click(screen.getByTestId("basketball-court"));
    expect(await screen.findByTestId("stat-dialog")).toBeInTheDocument();

    // Select Player 1
    const dialogF = screen.getByTestId("stat-dialog");
    const playerBtnF = await within(dialogF).findByRole("button", {
      name: "23",
    });
    await user.click(playerBtnF);

    // Select "S. Foul"
    await user.click(within(dialogF).getByLabelText(/Record S. Foul/i));

    // Click Save
    await user.click(within(dialogF).getByText(/Save/i));

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.FOUL_SHOOTING,
          playerId: "p1",
        }),
      );
    });
  });

  it("renders 5 slots in Live Lineup (1 occupied, 4 empty)", async () => {
    renderComponent();

    const sidebar = await screen.findByText(/Live Lineup/i);
    const container = sidebar.closest(".surface-card") || sidebar.parentElement;

    // 1 occupied slot
    expect(
      await within(container as HTMLElement).findByText(/Player 1/i),
    ).toBeInTheDocument();

    // 4 empty slots
    const emptySlots = within(container as HTMLElement).getAllByLabelText(
      /Empty lineup slot/i,
    );
    expect(emptySlots).toHaveLength(4);
  });

  it("tapping a sidebar slot opens Quick Sub dialog", async () => {
    const { user } = renderComponent();

    // Tap occupied slot
    const sidebar = await screen.findByText(/Live Lineup/i);
    const container = sidebar.closest(".surface-card") || sidebar.parentElement;
    // Use findByRole button to be more specific if possible, but lineup slots are buttons
    const playerBtnS = await within(container as HTMLElement).findByRole(
      "button",
      { name: /Player 1/i },
    );
    await user.click(playerBtnS);

    expect(await screen.findByText(/Quick Substitution/i)).toBeInTheDocument();

    // Verify pre-selection
    const dialog = screen.getByRole("dialog");
    const buttons = within(dialog).getAllByRole("button");
    const p1Button = buttons.find((b) => b.textContent?.includes("23"));
    expect(p1Button).toBeDefined();
  });

  it("handles quick sub in (to empty slot)", async () => {
    const { user } = renderComponent();

    const subBtn = await screen.findByRole("button", {
      name: /manage lineup substitutions/i,
    });
    await user.click(subBtn);

    expect(await screen.findByText(/Quick Substitution/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ON COURT/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/BENCH/i)[0]).toBeInTheDocument();
  });

  it("toggles the possession arrow", async () => {
    // Clear stats so no possession exists
    mockDb.stats.data = [];
    mockDb.notify();

    const { user } = renderComponent();

    const possBtn = await screen.findByRole("button", { name: /Poss/i });
    await user.click(possBtn);

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.POSSESSION,
          playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
        }),
      );
    });
  });

  it("displays team fouls in bonus state (5 fouls in quarters)", async () => {
    mockDb.seed({
      stats: Array.from({ length: 5 }).map((_, i) => ({
        id: `f${i}`,
        gameId: "g1",
        playerId: "p1",
        type: ACTION_TYPES.FOUL,
        period: 1,
        clockTime: 600,
        timestamp: `2023-01-01T00:00:0${i}Z`,
      })),
      games: [
        {
          id: "g1",
          teamId: "t1",
          periodType: "QUARTERS",
          completed: 0,
          opponent: "Opp",
          currentPeriod: 1,
          clockTime: 600,
          periodLength: 10,
        },
      ],
      teams: [{ id: "t1", name: "My Team", periodType: "QUARTERS" }],
      players: mockPlayers,
      teamPlayers: mockTeamPlayers,
    });

    renderComponent();
    expect(await screen.findByText(/BONUS →/i)).toBeInTheDocument();
  });

  it("automatically detects 3pt shot value in the corner", async () => {
    const { user } = renderComponent();

    const court = screen.getByTestId("basketball-court");
    court.setAttribute("data-x", "5");
    court.setAttribute("data-y", "5");
    await user.click(court);

    const dialog = await screen.findByTestId("stat-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-points", "3");
  });

  it("automatically detects 2pt shot value in the paint", async () => {
    const { user } = renderComponent();

    const court = screen.getByTestId("basketball-court");
    court.setAttribute("data-x", "50");
    court.setAttribute("data-y", "10");
    await user.click(court);

    const dialog = await screen.findByTestId("stat-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-points", "2");
  });

  it("🏀 CoachBoard: records opponent actions from the court", async () => {
    const { user } = renderComponent();

    // The buttons in Scoreboard have aria-label with score, but ActionControls might have others.
    // Let's use getByRole with name matching.
    const oppBtn = await screen.findByRole("button", {
      name: /Test Opponent/i,
    });

    await user.click(oppBtn);

    const court = screen.getByTestId("basketball-court");
    court.setAttribute("data-x", "75");
    court.setAttribute("data-y", "25");
    await user.click(court);

    const dialog = await screen.findByTestId("stat-dialog");
    expect(within(dialog).getByText(/Test Opponent/i)).toBeInTheDocument();

    await user.click(within(dialog).getByLabelText(/Record Make/i));

    const twoBtns = within(dialog).getAllByRole("button", { name: "2" });
    await user.click(twoBtns[0]);

    const saveBtn = within(dialog).getByText(/Save/i);
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.MAKE,
          playerId: "OPPONENT:2",
          points: 2,
        }),
      );
    });
  });
});
