import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import Players from "../pages/Players";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens/tokens";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockDb } from "../dbMock";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

const testPresets = [
  {
    id: "test-preset",
    name: "Test preset",
    description: "Test preset",
    tokens,
  },
];

describe("Players Component", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <CourtSightThemeProvider
        presets={testPresets}
        defaultPresetId={testPresets[0].id}
      >
        <BrowserRouter>
          <Players />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

  const findPlayersTitle = async () => {
    return (
      (await screen
        .findByRole("heading", { name: /^Players$/i })
        .catch(() => null)) || screen.getByText(/^Players$/i)
    );
  };

  const findCreatePlayerTrigger = () => {
    return (
      screen.queryByLabelText(/add new player/i) ||
      screen.queryByRole("button", { name: /create first player/i }) ||
      screen.queryByRole("button", { name: /add player/i })
    );
  };

  const findSubmitButton = () => {
    return (
      screen.queryByRole("button", { name: /^Add Player$/i }) ||
      screen.queryByRole("button", { name: /^Add$/i }) ||
      screen.queryByRole("button", { name: /create player/i })
    );
  };

  it("renders Players page and default empty state", async () => {
    renderComponent();

    expect(await findPlayersTitle()).toBeInTheDocument();
    expect(screen.getByText(/^No active players$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create first player/i }),
    ).toBeInTheDocument();
  });

  it("renders list of players", async () => {
    mockDb.seed({
      players: [
        { id: "p1", name: "John Doe", avatarColor: "#ff0000" },
        { id: "p2", name: "Jane Smith", avatarColor: "#0000ff" },
      ],
    });

    renderComponent();

    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it("adds a new player", async () => {
    renderComponent();

    const trigger = findCreatePlayerTrigger();
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger as HTMLElement);

    const nameInput = await screen.findByLabelText(/player name/i);
    fireEvent.change(nameInput, { target: { value: "New Player" } });

    const submitButton = findSubmitButton();
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockDb.players.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Player",
        }),
      );
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(mockDb.players, "toArray").mockImplementation(() => {
      throw new Error("Fetch failed");
    });

    renderComponent();

    expect(await findPlayersTitle()).toBeInTheDocument();
  });

  it("handles error when adding player", async () => {
    const logger = await import("../utils/logger");
    const loggerSpy = vi
      .spyOn(logger.logger, "error")
      .mockImplementation(() => {});

    vi.spyOn(mockDb.players, "add").mockImplementation(() => {
      throw new Error("Add failed");
    });

    renderComponent();

    const trigger = findCreatePlayerTrigger();
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger as HTMLElement);

    fireEvent.change(await screen.findByLabelText(/player name/i), {
      target: { value: "Fail Player" },
    });

    const submitButton = findSubmitButton();
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add player"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
