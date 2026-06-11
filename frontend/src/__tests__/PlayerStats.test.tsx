// frontend/src/__tests__/PlayerStats.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import PlayerStats from "../pages/PlayerStats";
import { mockDb } from "../dbMock";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { PRESETS } from "../theme/presets";

vi.mock("../components/game/BasketballCourt", () => ({
  default: ({ markers, heatmapData }: any) => (
    <div data-testid="basketball-court">
      {`markers-${markers?.length || 0}`}
      {`heatmap-${heatmapData ? Object.keys(heatmapData).length : 0}`}
    </div>
  ),
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
      <CourtSightThemeProvider
        presets={PRESETS}
        defaultPresetId={PRESETS[0].id}
      >
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/players/:playerId" element={<PlayerStats />} />
          </Routes>
        </MemoryRouter>
      </CourtSightThemeProvider>,
    );

  const advanceWorkflowToReview = async () => {
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/avatar color/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      await screen.findByPlaceholderText(/search teams/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      await screen.findByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  };

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
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    fireEvent.click(
      await screen.findByRole("button", { name: /edit player/i }),
    );

    const nameInput = await screen.findByLabelText(/player name/i);
    fireEvent.change(nameInput, { target: { value: "Jacob Updated" } });

    await advanceWorkflowToReview();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

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
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    fireEvent.click(await screen.findByRole("tab", { name: /^shot chart$/i }));

    expect(await screen.findByTestId("basketball-court")).toHaveTextContent(
      /markers-0/i,
    );

    fireEvent.click(screen.getByRole("button", { name: /heatmap/i }));

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
