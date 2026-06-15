import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  act,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import GameStats from "../pages/GameStats";
import { db } from "../db";

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
vi.mock("../db", () => ({
  db: {
    games: {
      get: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      update: vi.fn(),
    },
    teams: {
      get: vi.fn(),
    },
    stats: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
    teamPlayers: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
    players: {
      where: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
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

    // Set up standard mock resolutions
    (db.games.get as any).mockResolvedValue({
      id: mockGameId,
      teamId: mockTeamId,
      opponent: "Rivals",
      date: "2023-01-01",
      completed: 1,
    });
    (db.teams.get as any).mockResolvedValue({
      id: mockTeamId,
      name: "Our Team",
      periodType: "QUARTERS",
    });
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
    render(<GameStats />);

    await waitFor(() => screen.getByText(/Standard/i));

    const impactTab = screen.getByRole("button", {
      name: /Impact \(On\/Off\)/i,
    });
    await act(async () => {
      const user = userEvent.setup();
      await user.click(impactTab);
    });

    expect(
      screen.getByText(/Team Impact Analytics \(On\/Off\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Matchup Accountability/i)).toBeInTheDocument();
  });

  it("toggles clutch mode", async () => {
    render(<GameStats />);

    await waitFor(() => screen.getByText(/CLUTCH MODE/i));
    const clutchToggle = screen.getByText(/CLUTCH MODE/i);

    await act(async () => {
      const user = userEvent.setup();
      await user.click(clutchToggle);
    });

    // Should have different styles/classes now
    // Note: happy-dom might resolve CSS variables or handle them differently than jsdom
    // Checking for the resolved value or the variable itself depending on environment behavior
    const styles = window.getComputedStyle(clutchToggle);
    expect(
      styles.backgroundColor === "var(--cs-semantic-color-emphasis-clutch)" ||
        styles.backgroundColor === "rgb(255, 69, 0)" || // #FF4500
        styles.backgroundColor === "#FF4500",
    ).toBe(true);
  });

  it("opens the Practice Prescription dialog", async () => {
    render(<GameStats />);

    await waitFor(() =>
      screen.getByRole("button", { name: /Practice Planner/i }),
    );
    await act(async () => {
      const user = userEvent.setup();
      await user.click(
        screen.getByRole("button", { name: /Practice Planner/i }),
      );
    });

    expect(
      screen.getByText("Practice Prescription Engine"),
    ).toBeInTheDocument();
  });

  it("opens the Edit Game dialog", async () => {
    render(<GameStats />);

    await waitFor(() => screen.getByTestId("EditIcon"));
    await act(async () => {
      const user = userEvent.setup();
      await user.click(screen.getByTestId("EditIcon").closest("button")!);
    });

    expect(screen.getByText("Edit Game Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Opponent")).toHaveValue("Rivals");
  });
});
