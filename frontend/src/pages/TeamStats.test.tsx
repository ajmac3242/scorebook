import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, waitFor } from "../test-utils";
import TeamStats from "./TeamStats";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

// Mock dexie-react-hooks
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn(),
}));

// Mock the database
vi.mock("../db", () => ({
  db: {
    teams: { get: vi.fn(), update: vi.fn() },
    games: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
    },
    stats: {
      where: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    teamPlayers: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    players: {
      where: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
    opponents: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      first: vi.fn(),
      add: vi.fn(),
    },
    open: vi.fn().mockResolvedValue(true),
  },
}));

// Mock useNavigate and useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useParams: () => ({ teamId: "123" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock hooks
vi.mock("../hooks/useGames", () => ({ useGames: () => [] }));
vi.mock("../hooks/usePlayers", () => ({ usePlayers: () => [] }));

// Mock stats utilities
vi.mock("../utils/stats", () => ({
  calculatePlayerAggregates: () => [],
  calculateTeamAggregates: () => ({
    record: "0-0",
    ppg: "0",
    rpg: "0",
    apg: "0",
    ppp: "0",
    oppPpp: "0",
  }),
  calculateLineupStats: () => [],
  getInitials: () => "??",
}));

// Mock heavy sub-components
vi.mock("../components/EntityBanner", () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="banner">{title}</div>,
}));

vi.mock("../components/cards/SurfaceCard", () => ({
  SurfaceCard: ({ children }: any) => <div>{children}</div>,
}));

describe("TeamStats Page Minimal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team name and banner", () => {
    (useLiveQuery as any).mockImplementation((fn: any) => {
      const str = fn.toString();
      if (str.includes("db.teams.get")) return { id: "123", name: "Wildcats" };
      return undefined;
    });

    render(<TeamStats />);
    expect(screen.getByTestId("banner")).toHaveTextContent("Wildcats");
  });

  it("switches tabs between Schedule, Stats, Lineups, and Roster", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockImplementation((fn: any) => {
      const str = fn.toString();
      if (str.includes("db.teams.get")) return { id: "123", name: "Wildcats" };
      if (str.includes("db.games.where")) return [];
      return undefined;
    });

    render(<TeamStats />);

    const statsTab = screen.getByRole("tab", { name: "Stats" });
    await user.click(statsTab);
    expect(screen.getByRole("button", { name: "Last 5" })).toBeInTheDocument();

    const lineupsTab = screen.getByRole("tab", { name: "Lineups" });
    await user.click(lineupsTab);
    expect(screen.getByText(/No lineup data available/i)).toBeInTheDocument();

    const rosterTab = screen.getByRole("tab", { name: "Roster" });
    await user.click(rosterTab);
    expect(screen.getByRole("button", { name: /Manage Roster/i })).toBeInTheDocument();
  });

  it("toggles game count filter on Stats tab", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockImplementation((fn: any) => {
      const str = fn.toString();
      if (str.includes("db.teams.get")) return { id: "123", name: "Wildcats" };
      return undefined;
    });

    render(<TeamStats />);

    await user.click(screen.getByRole("tab", { name: "Stats" }));

    const last10Btn = screen.getByRole("button", { name: "Last 10" });
    await user.click(last10Btn);
    expect(last10Btn).toHaveAttribute("aria-pressed", "true");
  });

  it("displays team pending deletion alert and restore button when isDeleted", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockImplementation((fn: any) => {
      const str = fn.toString();
      if (str.includes("db.teams.get")) {
        return { id: "123", name: "Wildcats", deletedAt: new Date().toISOString() };
      }
      return undefined;
    });

    render(<TeamStats />);

    expect(screen.getByText("Team pending deletion")).toBeInTheDocument();
    const restoreBtn = screen.getByRole("button", { name: "Restore Team" });
    expect(restoreBtn).toBeInTheDocument();

    await user.click(restoreBtn);
    expect(db.teams.update).toHaveBeenCalledWith("123", { deletedAt: undefined, synced: 0 });
  });
});
