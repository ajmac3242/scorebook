// frontend/src/__tests__/Players.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import Players from "../pages/Players";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { PRESETS } from "../theme/presets";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockDb } from "../dbMock";
import { BrowserRouter } from "react-router-dom";
import React from "react";

describe("Players Component", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
    // Ensure mockDb has a teams stub so PlayerWorkflowDialog's
    // useLiveQuery(db.teams...) doesn't throw
    mockDb.seed({ teams: [] });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <CourtSightThemeProvider
        presets={PRESETS}
        defaultPresetId={PRESETS[0]?.id}
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
      screen.queryByRole("button", { name: /add first player/i }) ||
      screen.queryByRole("button", { name: /add player/i })
    );
  };

  // Helper: open dialog, fill name, advance through all steps to submit
  const fillAndSubmitNewPlayer = async (name: string) => {
    const trigger = findCreatePlayerTrigger();
    expect(trigger).toBeTruthy();
    fireEvent.click(trigger as HTMLElement);

    // Step 1 — Identity: fill name
    const nameInput = await screen.findByLabelText(/player name/i);
    fireEvent.change(nameInput, { target: { value: name } });

    // Advance: Step 1 → Step 2 (Continue)
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Advance: Step 2 → Step 3 (Continue)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Advance: Step 3 → Step 4 (Continue)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Step 4 — Review: click "Create player" (submit)
    const submitButton = await screen.findByRole("button", { name: /create player/i });
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton);
  };

  it("renders Players page and default empty state", async () => {
    renderComponent();

    expect(await findPlayersTitle()).toBeInTheDocument();
    expect(screen.getByText(/^No active players$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add first player/i }),
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

    await fillAndSubmitNewPlayer("New Player");

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
      .mockImplementation(() => { });

    vi.spyOn(mockDb.players, "add").mockImplementation(() => {
      throw new Error("Add failed");
    });

    renderComponent();

    await fillAndSubmitNewPlayer("Fail Player");

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add player"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});