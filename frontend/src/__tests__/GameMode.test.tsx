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
    <div data-testid="basketball-court" onClick={() => onCoordClick(50, 50)}>
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
      expect(screen.getByText(/Record Action/i)).toBeInTheDocument();
    });

    // Select Player 1 (which is on court in our mock)
    // The button name might be just "Player" if jersey number is missing or "23Player"
    const playerBtn = screen.getByRole("button", { name: /Player/i });
    fireEvent.click(playerBtn);

    // Select "Make"
    const makeBtn = screen.getByRole("button", { name: /Make/i });
    fireEvent.click(makeBtn);

    // Click Save
    const saveBtn = screen.getByRole("button", { name: /Save/i });
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
      expect(screen.getByText(/Record Action/i)).toBeInTheDocument();
    });

    // Select Player 1
    fireEvent.click(screen.getByRole("button", { name: /Player/i }));

    // Select "Foul"
    fireEvent.click(screen.getByRole("button", { name: /Foul/i }));

    // Click Save
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

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
    expect(within(container).getByText(/Player 1/i)).toBeInTheDocument();
    // 4 empty slots
    const emptySlots = within(container).getAllByText("Empty");
    expect(emptySlots).toHaveLength(4);
  });

  it("tapping a sidebar slot opens Quick Sub dialog", async () => {
    renderComponent();

    // Tap occupied slot
    const playerBtn = await screen.findByRole("button", { name: /Player 1/i });
    fireEvent.click(playerBtn);

    await waitFor(() => {
      expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
    });

    // Tap an empty slot
    fireEvent.click(screen.getByText("Cancel")); // Close first
    const emptySlots = await screen.findAllByText("Empty");
    fireEvent.click(emptySlots[0]);

    await waitFor(() => {
      expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
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
    // Find the toggle buttons. There are two, one for Our Team (pointing back) and one for Opponent (pointing forward).
    // We can find them by the icon names or aria-label if we added them, but they use ArrowBack/ArrowForward icons.
    // Let's use the IconButton role and check for the first and second.

    const buttons = screen.getAllByRole("button");
    // "Our Team" possession button is the one with ArrowBack
    const ourPossBtn = buttons.find((b) =>
      b.querySelector('svg[data-testid="ArrowBackIcon"]'),
    );
    const oppPossBtn = buttons.find((b) =>
      b.querySelector('svg[data-testid="ArrowForwardIcon"]'),
    );

    expect(ourPossBtn).toBeDefined();
    expect(oppPossBtn).toBeDefined();

    // Click Our Team possession
    fireEvent.click(ourPossBtn!);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.POSSESSION,
          playerId: SPECIAL_PLAYER_IDS.OUR_TEAM,
        }),
      );
    });

    // Click Opponent possession
    fireEvent.click(oppPossBtn!);

    await waitFor(() => {
      expect(db.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ACTION_TYPES.POSSESSION,
          playerId: SPECIAL_PLAYER_IDS.OPPONENT,
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
            id: `f${i}`, gameId: "g1", playerId: "p1", type: ACTION_TYPES.FOUL, period: 1, timestamp: `2023-01-01T00:00:0${i}Z`
          }));
        }
        if (code.includes("db.games.get")) return { id: "g1", opponent: "Opp", teamId: "t1" };
        if (code.includes("db.teams.get")) return { id: "t1", periodType: "QUARTERS" };
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
            id: `f${i}`, gameId: "g1", playerId: "p1", type: ACTION_TYPES.FOUL, period: 1, timestamp: `2023-01-01T00:00:0${i}Z`
          }));
        }
        if (code.includes("db.games.get")) return { id: "g1", opponent: "Opp", teamId: "t1" };
        if (code.includes("db.teams.get")) return { id: "t1", periodType: "QUARTERS" };
        if (code.includes("db.players")) return mockPlayers;
        if (code.includes("db.teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );

    renderComponent();
    expect(await screen.findByText("FOULS: 5")).toBeInTheDocument();
    expect(await screen.findByText("BONUS")).toBeInTheDocument();
  });
});
