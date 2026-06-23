// frontend/src/__tests__/PlayerStats.test.tsx
import {
  renderWithProviders as render,
  screen,
  waitFor,
  cleanup,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import PlayerStats from "../pages/PlayerStats";
import { mockDb } from "../dbMock";

vi.mock("../components/game/BasketballCourt", () => ({
  default: ({ markers, heatmapData }: any) => (
    <div data-testid="basketball-court">
      {`markers-${markers?.length || 0}`}
      {`heatmap-${heatmapData ? Object.keys(heatmapData).length : 0}`}
    </div>
  ),
}));

vi.mock("../pages/PlayerStats/dialogs/EditPlayerDialog", () => ({
  default: ({
    open,
    onClose,
    playerId,
    player,
  }: {
    open: boolean;
    onClose: () => void;
    playerId?: string;
    player?: { name?: string; avatarColor?: string };
    [key: string]: unknown;
  }) => {
    const [name, setName] = React.useState(player?.name ?? "");

    React.useEffect(() => {
      if (open) setName(player?.name ?? "");
    }, [open, player?.name]);

    if (!open) return null;

    return (
      <div role="dialog" aria-label="Edit player">
        <label htmlFor="player-name-mock">Player name</label>
        <input
          id="player-name-mock"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={async () => {
            const { db } = await import("../db");
            await db.players.update(playerId!, {
              name: name.trim(),
              avatarColor: player?.avatarColor,
              synced: 0,
            });
            onClose();
          }}
        >
          Save changes
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

describe("PlayerStats Page", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
    mockDb.seed({
      teams: [],
      teamPlayers: [],
      stats: [],
      games: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialPath = "/players/p1") =>
    render(
      <Routes>
        <Route path="/players/:playerId" element={<PlayerStats />} />
      </Routes>,
      { route: initialPath },
    );

  it("renders player identity and summary stats", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    expect(
      await screen.findByRole("heading", { name: /^Jacob$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/career stats/i)).toBeInTheDocument();
    expect(screen.getByText(/summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/shot chart/i).length).toBeGreaterThan(0);
  });

  it("renders team context when teamId is present", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      teams: [{ id: "t1", name: "Varsity", periodType: "QUARTERS" }],
      teamPlayers: [
        { id: "tp1", playerId: "p1", teamId: "t1", jerseyNumber: "12" },
      ],
      games: [],
      stats: [],
    });

    renderComponent("/players/p1?teamId=t1");

    expect(
      await screen.findByRole("heading", { name: /^Jacob$/i }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText(/varsity/i)).length).toBeGreaterThan(0);
    expect(
      screen.getByText((content) => content.trim() === "12"),
    ).toBeInTheDocument();
  });

  it("opens edit dialog and saves player updates", async () => {
    const user = userEvent.setup();
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    await user.click(
      await screen.findByRole("button", { name: /edit player/i }),
    );

    const nameInput = await screen.findByLabelText(/player name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Jacob Updated");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockDb.players.update).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({
          name: "Jacob Updated",
          synced: 0,
        }),
      );
    });
  });

  it("shows deletion warning for deleted players", async () => {
    mockDb.seed({
      players: [
        {
          id: "p1",
          name: "Jacob",
          avatarColor: "#5c8f61",
          deletedAt: new Date().toISOString(),
        },
      ],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    expect(
      await screen.findByText(/restore them from the players list/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/pending deletion/i).length).toBeGreaterThan(0);
  });

  it("toggles shot chart view", async () => {
    const user = userEvent.setup();
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    await user.click(await screen.findByRole("tab", { name: /^shot chart$/i }));

    expect(await screen.findByTestId("basketball-court")).toHaveTextContent(
      /markers-0/i,
    );

    await user.click(screen.getByRole("button", { name: /heatmap/i }));

    await waitFor(() => {
      expect(screen.getByTestId("basketball-court")).toHaveTextContent(
        /heatmap-0/i,
      );
    });
  });

  it("shows empty game log state when no games exist", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    expect(
      await screen.findByText(/no games recorded yet/i),
    ).toBeInTheDocument();
  });
});
