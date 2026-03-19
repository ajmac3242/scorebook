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
      playerId: "p1",
      type: "MAKE",
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("players")) return mockPlayers;
      if (code.includes("stats")) return mockStats;
      return [];
    });
  });

  it("renders GameMode page and displays players/stats", async () => {
    render(
      <BrowserRouter>
        <GameMode />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Live Game Tracker/i)).toBeInTheDocument();
    expect(screen.getAllByText("Player 1").length).toBeGreaterThan(0);
  });

  it("records a MAKE stat", async () => {
    render(
      <BrowserRouter>
        <GameMode />
      </BrowserRouter>,
    );

    // Sidebar lineup
    const lineup = screen.getByText("Active Lineup").parentElement;
    const playerBtn = within(lineup!).getByText("Player 1");
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
    render(
      <BrowserRouter>
        <GameMode />
      </BrowserRouter>,
    );

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(db.stats.delete).toHaveBeenCalledWith("s1");
    });
  });

  it("records a non-MAKE stat", async () => {
    render(
      <BrowserRouter>
        <GameMode />
      </BrowserRouter>,
    );

    // Sidebar lineup
    const lineup = screen.getByText("Active Lineup").parentElement;
    const playerBtn = within(lineup!).getByText("Player 1");
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
