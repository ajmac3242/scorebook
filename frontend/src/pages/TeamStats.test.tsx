import { describe, it, expect, vi, beforeEach } from "vitest";
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
  default: ({ title, extraActions, actions, onEdit, editLabel }: any) => (
    <div data-testid="banner">
      {title}
      {extraActions}
      {actions}
      {onEdit && (
        <button onClick={onEdit} aria-label={editLabel || "Edit"}>
          {editLabel || "Edit"}
        </button>
      )}
    </div>
  ),
}));

vi.mock("../components/cards/SurfaceCard", () => ({
  SurfaceCard: ({ children }: any) => <div>{children}</div>,
}));

import userEvent from "@testing-library/user-event";

describe("TeamStats Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders team name in banner", () => {
    (useLiveQuery as any).mockReturnValue({ name: "Wildcats" });

    render(<TeamStats />);
    expect(screen.getByTestId("banner")).toHaveTextContent("Wildcats");
  });

  it("renders team pending deletion alert when deletedAt is present and allows restoration", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({
      id: "123",
      name: "Wildcats",
      deletedAt: "2026-08-22T00:00:00Z",
    });

    render(<TeamStats />);

    expect(screen.getByText(/Team pending deletion/i)).toBeInTheDocument();

    const restoreBtn = screen.getByRole("button", { name: /Restore Team/i });
    expect(restoreBtn).toBeInTheDocument();

    await user.click(restoreBtn);

    expect(db.teams.update).toHaveBeenCalledWith("123", {
      deletedAt: undefined,
      synced: 0,
    });
  });

  it("navigates through tabs (Schedule, Stats, Lineups, Roster)", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({ id: "123", name: "Wildcats" });

    render(<TeamStats />);

    // Default tab is Schedule
    const statsTab = screen.getByRole("tab", { name: /Stats/i });
    await user.click(statsTab);

    // Verify game count filter appears on Stats tab
    expect(
      screen.getByRole("button", { name: /Show last 5 games/i }),
    ).toBeInTheDocument();

    const lineupsTab = screen.getByRole("tab", { name: /Lineups/i });
    await user.click(lineupsTab);

    const rosterTab = screen.getByRole("tab", { name: /Roster/i });
    await user.click(rosterTab);

    expect(
      screen.queryByRole("button", { name: /Show last 5 games/i }),
    ).not.toBeInTheDocument();
  });

  it("switches game count filter on Stats tab", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({ id: "123", name: "Wildcats" });

    render(<TeamStats />);

    const statsTab = screen.getByRole("tab", { name: /Stats/i });
    await user.click(statsTab);

    const last5Btn = screen.getByRole("button", { name: /Show last 5 games/i });
    await user.click(last5Btn);
    expect(last5Btn).toBeInTheDocument();

    const last10Btn = screen.getByRole("button", {
      name: /Show last 10 games/i,
    });
    await user.click(last10Btn);
    expect(last10Btn).toBeInTheDocument();

    const allBtn = screen.getByRole("button", { name: /Show all games/i });
    await user.click(allBtn);
    expect(allBtn).toBeInTheDocument();
  });

  it("opens TeamSettingsDialog when edit button in banner is clicked", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({ id: "123", name: "Wildcats" });

    render(<TeamStats />);

    const editBtn = screen.getByRole("button", { name: /Edit team settings/i });
    await user.click(editBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens AddGameDialog from Schedule tab", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({ id: "123", name: "Wildcats" });

    render(<TeamStats />);

    const scheduleTab = screen.getByRole("tab", { name: /Schedule/i });
    await user.click(scheduleTab);

    // Click Add Game button or Add First Game button
    const addGameBtn = screen.getAllByRole("button", { name: /Add Game/i })[0];
    await user.click(addGameBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens ManageRosterDialog from Roster tab", async () => {
    const user = userEvent.setup();
    (useLiveQuery as any).mockReturnValue({ id: "123", name: "Wildcats" });

    render(<TeamStats />);

    const rosterTab = screen.getByRole("tab", { name: /Roster/i });
    await user.click(rosterTab);

    const manageRosterBtn = screen.getByRole("button", {
      name: /Manage Roster/i,
    });
    await user.click(manageRosterBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
