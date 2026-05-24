import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TeamStats from "../pages/TeamStats";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { useLiveQuery } from "dexie-react-hooks";

// Mock dexie-react-hooks
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn(),
}));

// Mock the database
vi.mock("../db", () => ({
  db: {
    teams: { get: vi.fn(), update: vi.fn() },
    games: { where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]), add: vi.fn(), update: vi.fn() },
    stats: { where: vi.fn().mockReturnThis(), anyOf: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) },
    teamPlayers: { where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]), add: vi.fn(), delete: vi.fn(), update: vi.fn() },
    players: { where: vi.fn().mockReturnThis(), anyOf: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) },
    opponents: { where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]), first: vi.fn(), add: vi.fn() },
    open: vi.fn().mockResolvedValue(true),
  },
}));

// Mock useNavigate and useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual as any,
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
  calculateTeamAggregates: () => ({ record: "0-0", ppg: "0", rpg: "0", apg: "0", ppp: "0", oppPpp: "0" }),
  calculateLineupStats: () => [],
  getInitials: () => "??",
}));

// Mock heavy sub-components
vi.mock("../components/EntityBanner", () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="banner">{title}</div>,
}));

vi.mock("../components/SharedUI", () => ({
  MoleskineCard: ({ children }: any) => <div>{children}</div>,
  StatItem: () => <div />,
}));

describe("TeamStats Page Minimal", () => {
  it("renders", () => {
    (useLiveQuery as any).mockReturnValue({ name: "Wildcats" });

    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <TeamStats />
        </BrowserRouter>
      </CourtSightThemeProvider>
    );
    expect(screen.getByTestId("banner")).toHaveTextContent("Wildcats");
  });
});
