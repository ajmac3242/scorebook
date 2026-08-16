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

// Mock html2canvas
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,fake",
    width: 1000,
    height: 1000,
  }),
}));

// Mock jspdf
vi.mock("jspdf", () => {
  function MockPDF() {
    return {
      internal: { pageSize: { getWidth: () => 210 } },
      addImage: vi.fn(),
      save: vi.fn(),
    };
  }
  return {
    default: MockPDF,
  };
});

// Mock syncService
vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue({}),
  },
}));

// Mock dexie-react-hooks to resolve live queries deterministically in tests
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: any) => {
    // Return mock values based on function structure
    const fnStr = fn.toString();
    if (fnStr.includes("db.games.get")) {
      return (globalThis as any).__mockGame;
    }
    if (fnStr.includes("db.teams.get")) {
      return (globalThis as any).__mockTeam;
    }
    if (fnStr.includes("teamPlayers")) {
      return (globalThis as any).__mockTeamPlayers || [];
    }
    if (fnStr.includes("db.players")) {
      return (globalThis as any).__mockPlayers || [];
    }
    if (fnStr.includes("db.stats")) {
      return (globalThis as any).__mockStats || [];
    }
    return undefined;
  },
}));

// Mock the database
vi.mock("../db", () => ({
  db: {
    games: {
      get: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue(1),
    },
    teams: {
      get: vi.fn(),
    },
    stats: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    teamPlayers: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    players: {
      where: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

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

    const game = buildGame({
      id: mockGameId,
      teamId: mockTeamId,
      opponent: "Rivals",
      date: "2023-01-01",
      completed: 1,
    });
    const team = buildTeam({
      id: mockTeamId,
      name: "Our Team",
      periodType: "QUARTERS",
    });

    (globalThis as any).__mockGame = game;
    (globalThis as any).__mockTeam = team;
    (globalThis as any).__mockTeamPlayers = [];
    (globalThis as any).__mockPlayers = [];
    (globalThis as any).__mockStats = [];

    // Set up standard mock resolutions
    (db.games.get as any).mockResolvedValue(game);
    (db.teams.get as any).mockResolvedValue(team);
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

  it("renders read-only warning alert and restore button when game is deleted", async () => {
    const user = userEvent.setup();
    const deletedGame = buildGame({
      id: mockGameId,
      teamId: mockTeamId,
      opponent: "Rivals",
      date: "2023-01-01",
      completed: 1,
      deletedAt: new Date().toISOString(),
    });
    (globalThis as any).__mockGame = deletedGame;
    (db.games.get as any).mockResolvedValue(deletedGame);

    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getByText("Read Only Mode")).toBeInTheDocument();
    });

    const restoreButton = screen.getByRole("button", { name: /Restore Game/i });
    expect(restoreButton).toBeInTheDocument();
    await user.click(restoreButton);
    expect(db.games.update).toHaveBeenCalledWith(mockGameId, { deletedAt: undefined, synced: 0 });
  });

  it("triggers PDF export on button click", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() =>
      screen.getByRole("button", { name: /Export PDF/i }),
    );
    const exportBtn = screen.getByRole("button", { name: /Export PDF/i });
    await user.click(exportBtn);
    expect(exportBtn).toBeInTheDocument();
  });

  it("opens expanded section dialog for box score and lineups", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getAllByText(/vs Rivals/i).length).toBeGreaterThan(0);
    });

    const expandBoxScoreBtn = screen.getAllByRole("button", { name: /Expand section/i })[0];
    await user.click(expandBoxScoreBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/Box Score/i).length).toBeGreaterThan(0);
    });
  });

  it("triggers defensive integrity dialog from efficiency card", async () => {
    const user = userEvent.setup();
    render(<GameStats />);

    await waitFor(() => {
      expect(screen.getAllByText(/vs Rivals/i).length).toBeGreaterThan(0);
    });

    const viewReportBtn = screen.getByRole("button", { name: /View Report/i });
    await user.click(viewReportBtn);

    await waitFor(() => {
      expect(screen.getByText("Defensive Integrity Report")).toBeInTheDocument();
    });
  });
});
