import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OpponentScoutingReport from "../pages/OpponentScoutingReport";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

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
  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <CourtSightThemeProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </CourtSightThemeProvider>,
    );
  };

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
    renderWithProviders(<OpponentScoutingReport />);

    await waitFor(() => {
      expect(screen.getByText("Rivals")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Player Scouting \(Cumulative\)/i),
    ).toBeInTheDocument();
  });
});
