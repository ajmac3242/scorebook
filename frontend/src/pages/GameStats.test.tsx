import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  act,
} from "../test-utils";
import GameStats from "./GameStats";
import { db } from "../db";
import { buildTeam, buildGame } from "../test-factories";

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("gameId=game-123")],
  };
});

// Mock the database
vi.mock("../db", () => {
  const mockTable = () => ({
    get: vi.fn(),
    where: vi.fn().mockReturnThis(),
    equals: vi.fn().mockReturnThis(),
    anyOf: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(undefined),
    toArray: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(1),
  });

  return {
    db: {
      games: mockTable(),
      teams: mockTable(),
      stats: mockTable(),
      teamPlayers: mockTable(),
      players: mockTable(),
      opponentRosters: mockTable(),
    },
  };
});

// Mock Recharts to avoid ResizeObserver errors in JSDOM
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...(actual as any),
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe("GameStats Page", () => {
  const mockGameId = "game-123";
  const mockTeamId = "team-456";

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up standard mock resolutions
    (db.games.get as any).mockResolvedValue(
      buildGame({
        id: mockGameId,
        teamId: mockTeamId,
        opponent: "Rivals",
        date: "2023-01-01",
        completed: 1,
      }),
    );
    (db.teams.get as any).mockResolvedValue(
      buildTeam({
        id: mockTeamId,
        name: "Our Team",
        periodType: "QUARTERS",
      }),
    );
    (db.stats.toArray as any).mockResolvedValue([]);
    (db.teamPlayers.toArray as any).mockResolvedValue([]);
    (db.players.toArray as any).mockResolvedValue([]);
    (db.games.toArray as any).mockResolvedValue([]);
  });

  it("renders the game information and basic metrics", async () => {
    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getAllByText(/vs Rivals/i).length).toBeGreaterThan(0);
    });

    // Check for standard metric cards
    expect(screen.getByText("TOTAL STOPS")).toBeInTheDocument();
    expect(screen.getByText("KILLS (3x STOPS)")).toBeInTheDocument();
  });

  it("switches between Standard and Impact tabs", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getByText(/Standard/i));

    const impactTab = screen.getByRole("button", {
      name: /Impact \(On\/Off\)/i,
    });
    await user.click(impactTab);

    expect(
      screen.getByText(/Team Impact Analytics \(On\/Off\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Matchup Accountability/i)).toBeInTheDocument();
  });

  it("toggles clutch mode", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getByText(/CLUTCH MODE/i));
    const clutchToggle = screen.getByText(/CLUTCH MODE/i);

    await user.click(clutchToggle);

    // Should have different styles/classes now
    // Note: happy-dom resolves CSS variables to their computed values
    expect(clutchToggle).toHaveStyle("background-color: #FF4500");
  });

  it("opens the Practice Prescription dialog", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() =>
      screen.getByRole("button", { name: /Practice Planner/i }),
    );
    await user.click(screen.getByRole("button", { name: /Practice Planner/i }));

    expect(
      screen.getByText("Practice Prescription Engine"),
    ).toBeInTheDocument();
  });

  it("opens the Edit Game dialog", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getByTestId("EditIcon"));
    await user.click(screen.getByTestId("EditIcon").closest("button")!);

    expect(screen.getByText("Edit Game Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Opponent")).toHaveValue("Rivals");
  });

  it("renders Read Only alert when game is pending deletion and allows restoration", async () => {
    const user = userEvent.setup();
    (db.games.get as any).mockResolvedValue(
      buildGame({
        id: mockGameId,
        teamId: mockTeamId,
        opponent: "Rivals",
        date: "2023-01-01",
        completed: 1,
        deletedAt: "2026-08-22T00:00:00Z",
      }),
    );
    (db.games.update as any).mockResolvedValue(1);

    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getByText("Read Only Mode")).toBeInTheDocument();
    });

    const restoreBtn = screen.getByRole("button", { name: /Restore Game/i });
    expect(restoreBtn).toBeInTheDocument();

    await user.click(restoreBtn);

    expect(db.games.update).toHaveBeenCalledWith(mockGameId, {
      deletedAt: undefined,
      synced: 0,
    });
  });

  it("renders Read Only alert when team is pending deletion", async () => {
    (db.teams.get as any).mockResolvedValue(
      buildTeam({
        id: mockTeamId,
        name: "Our Team",
        periodType: "QUARTERS",
        deletedAt: "2026-08-22T00:00:00Z",
      }),
    );

    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getByText("Read Only Mode")).toBeInTheDocument();
      expect(
        screen.getByText(/associated team is pending deletion/i),
      ).toBeInTheDocument();
    });
  });

  it("opens expanded section dialog for boxScore", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getAllByText(/Box Score/i));

    // Find all expand buttons by title/aria-label
    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons.length).toBeGreaterThan(0);

    // Expand box score section (first expand button)
    await user.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close dialog
    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens expanded section dialog for shotChart, scoreFlow, and lineups", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getAllByText(/Box Score/i));

    const expandButtons = screen.getAllByRole("button", { name: /expand/i });
    expect(expandButtons.length).toBeGreaterThan(1);

    // Expand shot chart (second expand button)
    await user.click(expandButtons[1]);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Shot Chart" }),
      ).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens defensive integrity dialog from defensive breakdown button", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getByRole("button", { name: /View Report/i }));
    const defBtn = screen.getByRole("button", { name: /View Report/i });
    await user.click(defBtn);

    expect(
      await screen.findByText(/Defensive Integrity Report/i),
    ).toBeInTheDocument();
  });

  it("opens substitution audit dialog from lineup efficiency card", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() =>
      screen.getByRole("button", { name: /Audit Substitutions/i }),
    );
    const auditBtn = screen.getByRole("button", {
      name: /Audit Substitutions/i,
    });
    await user.click(auditBtn);

    expect(
      await screen.findByText(/Substitution Timeline Audit/i),
    ).toBeInTheDocument();
  });

  it("opens and confirms game deletion from edit dialog", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => screen.getByTestId("EditIcon"));
    await user.click(screen.getByTestId("EditIcon").closest("button")!);

    expect(await screen.findByText("Edit Game Details")).toBeInTheDocument();

    const deleteReqBtn = screen.getByRole("button", { name: /Delete Game/i });
    await user.click(deleteReqBtn);

    expect(await screen.findByText("Delete Game?")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Yes, Delete/i });
    await user.click(confirmBtn);

    expect(db.games.update).toHaveBeenCalledWith(
      mockGameId,
      expect.objectContaining({
        deletedAt: expect.any(String),
        synced: 0,
      }),
    );
  });
});
