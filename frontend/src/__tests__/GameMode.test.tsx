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

describe("GameMode Component", () => {
  const mockPlayers = [{ id: "p1", name: "Player 1", defaultNumber: "23" }];
  const mockStats = [
    {
      id: "s1",
      gameId: "practice-session",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("players")) return mockPlayers;
      if (code.includes("stats")) return mockStats;
      if (code.includes("db.games.get")) return { opponent: "Test Opponent", date: "2023-01-01" };
      return [];
    });
  });

  const renderComponent = () => render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <GameMode />
      </BrowserRouter>
    </ThemeProvider>
  );

  it("renders GameMode page and displays players/stats", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/vs Test Opponent/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Player 1").length).toBeGreaterThan(0);
  });

  it("records a MAKE stat", async () => {
    renderComponent();

    // Sidebar lineup (Roster)
    const lineup = await screen.findByText("Team Roster");
    const playerBtn = within(lineup.parentElement!).getByText("Player 1");
    fireEvent.click(playerBtn);

    // Click court
    fireEvent.click(screen.getByTestId("basketball-court"));

    // Action dialog - wait for text
    await waitFor(() => {
      expect(screen.getByText("What happened?")).toBeInTheDocument();
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

    // Sidebar lineup
    const lineup = await screen.findByText("Team Roster");
    const playerBtn = within(lineup.parentElement!).getByText("Player 1");
    fireEvent.click(playerBtn);

    // Click court
    fireEvent.click(screen.getByTestId("basketball-court"));

    // Action dialog
    await waitFor(() => {
      expect(screen.getByText("What happened?")).toBeInTheDocument();
    });

    // Non-MAKE types trigger save immediately
    fireEvent.click(screen.getByText("Rebound"));

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalled();
    });
  });
});
