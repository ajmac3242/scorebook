import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import PlayerStats from "../pages/PlayerStats";
import { mockDb } from "../dbMock";

vi.mock("../components/BasketballCourt", () => ({
  default: ({ view }: { view: string }) => (
    <div data-testid="basketball-court">{view}</div>
  ),
}));

const theme = createTheme();

describe("PlayerStats Page", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (initialPath = "/players/p1") =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/players/:playerId" element={<PlayerStats />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
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

    expect(await screen.findByText(/^Jacob$/i)).toBeInTheDocument();
    expect(screen.getByText(/career stats/i)).toBeInTheDocument();
    expect(screen.getByText(/summary/i)).toBeInTheDocument();
    expect(screen.getByText(/shot chart/i)).toBeInTheDocument();
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

    expect(await screen.findByText(/^Jacob$/i)).toBeInTheDocument();
    expect(screen.getByText(/varsity/i)).toBeInTheDocument();
    expect(screen.getByText(/#12/i)).toBeInTheDocument();
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

    expect(await screen.findAllByText(/pending deletion/i)).toHaveLength(2);
    expect(
      screen.getByText(/restore them from the players list/i),
    ).toBeInTheDocument();
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

    expect(await screen.findByTestId("basketball-court")).toHaveTextContent(
      "markers",
    );

    fireEvent.click(screen.getByRole("button", { name: /heatmap/i }));

    await waitFor(() => {
      expect(screen.getByTestId("basketball-court")).toHaveTextContent(
        "heatmap",
      );
    });
  });

  it("shows empty action log state when no filtered events exist", async () => {
    mockDb.seed({
      players: [{ id: "p1", name: "Jacob", avatarColor: "#5c8f61" }],
      stats: [],
      games: [],
      teams: [],
      teamPlayers: [],
    });

    renderComponent();

    expect(
      await screen.findByText(/no actions match the current filters/i),
    ).toBeInTheDocument();
  });
});
