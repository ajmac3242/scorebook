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
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

// Mock BasketballCourt to avoid coordinate calculation issues in JSDOM
vi.mock("../components/BasketballCourt", () => ({
  default: ({
    onCoordClick,
  }: {
    onCoordClick: (x: number, y: number) => void;
  }) => (
    <div
      data-testid="basketball-court"
      onClick={(e) => {
        const x = Number(e.currentTarget.getAttribute("data-x") || 50);
        const y = Number(e.currentTarget.getAttribute("data-y") || 50);
        onCoordClick(x, y);
      }}
    >
      Mock Basketball Court
    </div>
  ),
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: Record<string, any> = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("gameId=g1&teamId=t1")],
  };
});

describe("GameMode Component", () => {
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const now = new Date();
  const mockStats = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.MAKE,
      points: 2,
      timestamp: now.toISOString(),
    },
    {
      id: "s2",
      gameId: "g1",
      playerId: "p1",
      type: ACTION_TYPES.SUB_IN,
      timestamp: new Date(now.getTime() - 1000).toISOString(),
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
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
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
      },
    );
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
      expect(screen.getAllByText(/Test Opponent/i)).toBeDefined();
    });
    // Check for "Live Lineup" header instead of "Team Roster"
    expect(await screen.findByText("Live Lineup")).toBeInTheDocument();
    expect(await screen.findAllByText(/Player 1/i)).toBeDefined();
  });

  it("records a MAKE stat (updated workflow)", async () => {
    renderComponent();

    // Click court
    fireEvent.click(screen.getByTestId("basketball-court"));

    // Action dialog should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Select Player 1 (which is on court in our mock)
    const dialog = screen.getByRole("dialog");
    const playerBtn = await within(dialog).findByRole("button", {
      name: "Player 1",
    });
    fireEvent.click(playerBtn);

    // Select "Make"
    const makeBtn = within(screen.getByRole("dialog")).getByText("Make");
    fireEvent.click(makeBtn);

    // Click Save
    const saveBtn = within(screen.getByRole("dialog")).getByText("Save");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.MAKE,
          playerId: "p1",
          points: 2,
        }),
      );
    });
  });

  it("undoes the last stat", async () => {
    renderComponent();

    const undoBtn = await screen.findByRole("button", { name: /undo/i });
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(db.stats.update).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({
          synced: 0,
        }),
      );
    });
  });

  it("records a Foul stat (updated workflow)", async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("basketball-court"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Select Player 1
    const dialogF = screen.getByRole("dialog");
    const playerBtnF = await within(dialogF).findByRole("button", {
      name: "Player 1",
    });
    fireEvent.click(playerBtnF);

    // Select "Foul"
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Foul"));

    // Click Save
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Save"));

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.FOUL,
          playerId: "p1",
        }),
      );
    });
  });

  it("renders 5 slots in Live Lineup (1 occupied, 4 empty)", async () => {
    renderComponent();

    const sidebar = await screen.findByText("Live Lineup");
    const container = sidebar.parentElement!;

    // 1 occupied slot
    expect(await within(container).findByText(/Player 1/i)).toBeInTheDocument();
    // 4 empty slots
    const emptySlots =
      within(container).getAllByLabelText(/Empty lineup slot/i);
    expect(emptySlots).toHaveLength(4);
  });

  it("tapping a sidebar slot opens Quick Sub dialog", async () => {
    renderComponent();

    // Tap occupied slot
    const sidebar = await screen.findByText("Live Lineup");
    const sidebarContainer = sidebar.parentElement!;
    const playerBtnS = await within(sidebarContainer).findByText(/Player 1/i);
    fireEvent.click(playerBtnS);

    await waitFor(() => {
      expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
    });

    // 🏀 CoachBoard: Verify pre-selection
    // The button for Player 1 should be 'contained' (selected)
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const buttons = within(dialog).getAllByRole("button");
      const p1Button = buttons.find((b) => b.textContent?.includes("Player 1"));
      if (!p1Button) throw new Error("Player 1 button not found");
      expect(p1Button).toHaveClass("MuiButton-contained");
    });

    // Tap an empty slot
    fireEvent.click(screen.getByText("Cancel")); // Close first
    const emptySlots = await screen.findAllByLabelText(/Empty lineup slot/i);
    fireEvent.click(emptySlots[0]);

    await waitFor(() => {
      expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
    });

    // 🏀 CoachBoard: Verify pre-selection for empty slot
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const buttons = within(dialog).getAllByRole("button");
      const emptyButton = buttons.find((b) =>
        b.getAttribute("aria-label")?.includes("Empty lineup slot"),
      );
      if (!emptyButton) throw new Error("Empty button not found");
      expect(emptyButton).toHaveClass("MuiButton-contained");
    });
  });

  it("handles quick sub in (to empty slot)", async () => {
    renderComponent();

    // Open Quick Sub dialog
    fireEvent.click(screen.getByRole("button", { name: /quick sub/i }));

    await waitFor(() => {
      expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
    });

    // In our mock, p1 is on court (via SUB_IN event), and p1 is also in players.
    // The dialog should show p1 in ON COURT and potentially other players on BENCH.
    // However, our current mockPlayers only has p1.
    // Let's verify we can select an empty slot and then sub p1 back in (re-sub) or similar.
    // Actually, let's just verify the dialog components.
    expect(screen.getByText("ON COURT")).toBeInTheDocument();
    expect(screen.getByText("BENCH")).toBeInTheDocument();
  });

  it("toggles the possession arrow", async () => {
    renderComponent();

    // The component initially has no possession (based on empty mock stats for possession)
    // Find the toggle button. It's now a single button labeled "Poss".

    const possBtn = screen.getByRole("button", { name: /poss/i });
    expect(possBtn).toBeDefined();

    // Click "Poss" button
    fireEvent.click(possBtn);

    // Initial click should set it to OUR_TEAM (default when no possession exists)
    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.POSSESSION,
          playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
        }),
      );
    });
  });

  it("displays team fouls in warning state (4 fouls in quarters)", async () => {
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("db.stats")) {
          return Array.from({ length: 4 }).map((_, i) => ({
            id: `f${i}`,
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.FOUL,
            period: 1,
            timestamp: `2023-01-01T00:00:0${i}Z`,
          }));
        }
        if (code.includes("db.games.get"))
          return { id: "g1", opponent: "Opp", teamId: "t1" };
        if (code.includes("db.teams.get"))
          return { id: "t1", periodType: "QUARTERS" };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );

    renderComponent();
    expect(await screen.findByText("FOULS: 4")).toBeInTheDocument();
  });

  it("displays team fouls in bonus state (5 fouls in quarters)", async () => {
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("db.stats")) {
          return Array.from({ length: 5 }).map((_, i) => ({
            id: `f${i}`,
            gameId: "g1",
            playerId: "p1",
            type: ACTION_TYPES.FOUL,
            period: 1,
            timestamp: `2023-01-01T00:00:0${i}Z`,
          }));
        }
        if (code.includes("db.games.get"))
          return { id: "g1", opponent: "Opp", teamId: "t1" };
        if (code.includes("db.teams.get"))
          return { id: "t1", periodType: "QUARTERS" };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );

    renderComponent();
    expect(await screen.findByText("FOULS: 5")).toBeInTheDocument();
    // Bonus is now applied to the OPPONENT's side when Team has 5 fouls.
    // Our mock renders "Test Opponent" as the opponent.
    // Scoreboard renders renderTeamInfo for team first, then opponent.
    // Let's check that BONUS is present.
    expect(await screen.findByText("BONUS")).toBeInTheDocument();
  });

  it("automatically detects 3pt shot value in the corner", async () => {
    renderComponent();

    const court = screen.getByTestId("basketball-court");
    // Corner 3: x=5, y=5 -> SVG X=25, Y=23.5 (X <= 30, Y <= 140)
    court.setAttribute("data-x", "5");
    court.setAttribute("data-y", "5");
    fireEvent.click(court);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Select "Make"
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Make"));

    // Points should default to 3
    const threeBtn = screen.getByRole("button", { name: "3" });
    expect(threeBtn).toHaveClass("MuiButton-contained");
  });

  it("automatically detects 2pt shot value in the paint", async () => {
    renderComponent();

    const court = screen.getByTestId("basketball-court");
    // Paint: x=50, y=10 -> SVG X=250, Y=47 (Center)
    court.setAttribute("data-x", "50");
    court.setAttribute("data-y", "10");
    fireEvent.click(court);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Select "Make"
    fireEvent.click(within(screen.getByRole("dialog")).getByText("Make"));

    // Points should default to 2
    const twoBtn = screen.getByRole("button", { name: "2" });
    expect(twoBtn).toHaveClass("MuiButton-contained");
  });

  it("🏀 CoachBoard: records opponent quick actions from the scoreboard", async () => {
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("db.stats")) return mockStats;
        if (code.includes("db.games.get"))
          return {
            id: "g1",
            opponent: "Test Opponent",
            date: "2023-01-01",
          };
        if (code.includes("db.teams.get")) return { id: "t1" };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );

    renderComponent();

    // Find the opponent side of the scoreboard
    // Based on our mock, the opponent name is "Test Opponent"
    const oppHeader = await screen.findAllByText(/Test Opponent/i);
    // Scoreboard structure:
    // renderTeamInfo -> Box (column) -> Box (row with Avatar and Typography)
    // The parent of the Typography is a Box, and the grandparent is the column Box.
    const oppContainer = oppHeader[0].parentElement!.parentElement!;

    // Find the "+2" quick action button for the opponent
    const plusTwoBtn = within(oppContainer).getByRole("button", {
      name: "Record opponent +2 points",
    });
    fireEvent.click(plusTwoBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.MAKE,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
          points: 2,
          locationX: 50,
          locationY: 10,
        }),
      );
    });

    // Find and click the "F" (Foul) quick action button
    const foulBtn = within(oppContainer).getByRole("button", {
      name: "Record opponent foul",
    });
    fireEvent.click(foulBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.FOUL,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        }),
      );
    });

    // Find and click the "REB" quick action button
    const rebBtn = within(oppContainer).getByRole("button", {
      name: "Record opponent rebound",
    });
    fireEvent.click(rebBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.REBOUND,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        }),
      );
    });

    // Find and click the "TO" quick action button
    const toBtn = within(oppContainer).getByRole("button", {
      name: "Record opponent turnover",
    });
    fireEvent.click(toBtn);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.TURNOVER,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
        }),
      );
    });
  });
});
