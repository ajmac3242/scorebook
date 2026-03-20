import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import GameMode from "../pages/GameMode";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import { ACTION_TYPES } from "../constants/stats";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

// Mock BasketballCourt to avoid coordinate calculation issues in JSDOM
vi.mock("../components/BasketballCourt", () => ({
  default: ({ onCoordClick }: any) => (
    <div data-testid="basketball-court" onClick={() => onCoordClick(50, 50)}>
      Mock Basketball Court
    </div>
  ),
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("gameId=g1&teamId=t1")],
  };
});

describe("GameMode Component", () => {
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const mockStats = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      timestamp: new Date().toISOString(),
    },
  ];
  const mockTeamPlayers = [
    {
      id: "tp1",
      teamId: "t1",
      playerId: "p1",
      jerseyNumber: "23",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("db.stats")) return mockStats;
      if (code.includes("db.games.get"))
        return {
          id: "g1",
          opponent: "Test Opponent",
          date: "2023-01-01",
        };
      if (code.includes("db.players")) return mockPlayers;
      if (code.includes("db.teamPlayers")) return mockTeamPlayers;
      return [];
    });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <GameMode />
        </BrowserRouter>
      </ThemeProvider>,
    );

  it("renders GameMode page and displays players/stats", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/vs Test Opponent/i)).toBeInTheDocument();
    });
    // Use getAllByText because it appears in Roster and Recent Actions
    expect(await screen.findAllByText(/Player 1/i)).toBeDefined();
  });

  it("records a MAKE stat", async () => {
    renderComponent();

    // Roster is in a Paper with "Team Roster" title
    const rosterHeader = await screen.findByText("Team Roster");
    const rosterContainer = rosterHeader.parentElement!;
    const playerBtn = within(rosterContainer).getByText(/Player 1/i);
    fireEvent.click(playerBtn);

    // Click court
    fireEvent.click(screen.getByTestId("basketball-court"));

    // Action dialog
    await waitFor(() => {
      expect(screen.getByText(/Record Action/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Make"));
    fireEvent.click(screen.getByText("3"));

    // Find Save button in dialog
    const saveBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalled();
    });
  });

  it("undoes the last stat", async () => {
    renderComponent();

    const undoBtn = await screen.findByRole("button", { name: /undo/i });
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(db.stats.delete).toHaveBeenCalledWith("s1");
    });
  });

  it("records a non-MAKE stat", async () => {
    renderComponent();

    const rosterHeader = await screen.findByText("Team Roster");
    const rosterContainer = rosterHeader.parentElement!;
    const playerBtn = within(rosterContainer).getByText(/Player 1/i);
    fireEvent.click(playerBtn);

    // Click court
    fireEvent.click(screen.getByTestId("basketball-court"));

    // Action dialog
    await waitFor(() => {
      expect(screen.getByText(/Record Action/i)).toBeInTheDocument();
    });

    // Non-MAKE types trigger save immediately
    fireEvent.click(screen.getByText("Rebound"));

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalled();
    });
  });
});
