import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders as render,
  screen,
  waitFor,
} from "../test-utils";
import OpponentScoutingReport from "../pages/OpponentScoutingReport";
import { db } from "../db";

// Mock useNavigate and useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useParams: () => ({ opponentId: "opp-1" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock the database
vi.mock("../db", () => ({
  db: {
    opponents: {
      get: vi.fn(),
    },
    games: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
    stats: {
      where: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
  },
}));

describe("OpponentScoutingReport Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.opponents.get as any).mockResolvedValue({
      id: "opp-1",
      name: "Rivals",
    });
    (db.games.toArray as any).mockResolvedValue([]);
    (db.stats.toArray as any).mockResolvedValue([]);
  });

  it("renders the scouting report with opponent name", async () => {
    render(<OpponentScoutingReport />);

    await waitFor(() => {
      expect(screen.getByText("Rivals")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Player Scouting \(Cumulative\)/i),
    ).toBeInTheDocument();
  });
});
