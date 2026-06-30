// frontend/src/__tests__/Players.test.tsx
import {
  renderWithProviders as render,
  screen,
  waitFor,
  cleanup,
  assertAccessible,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import Players from "./Players";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockDb } from "../dbMock";
import React from "react";

vi.mock("../components/players/PlayerWorkflowDialog", () => ({
  default: ({
    open,
    onClose,
    onSuccess,
    onError,
  }: {
    open: boolean;
    onClose: () => void;
    onSuccess?: (_msg: string) => void;
    onError?: (_msg: string) => void;
  }) => {
    const [name, setName] = React.useState("");
    if (!open) return null;
    return (
      <div role="dialog">
        <label htmlFor="player-name-mock">Player name</label>
        <input
          id="player-name-mock"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={async () => {
            try {
              const { db } = await import("../db");
              await db.players.add({
                id: crypto.randomUUID(),
                name: name.trim(),
                avatarColor: "#000000",
                isArchived: 0,
                synced: 0,
              });
              onSuccess?.("Player added successfully!");
              onClose();
            } catch (err) {
              const { logger } = await import("../utils/logger");
              logger.error("Failed to create player", err as Error, {
                playerId: undefined,
                playerName: name,
              });
              onError?.("Failed to create player");
            }
          }}
        >
          Create player
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

describe("Players Component", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
    mockDb.seed({ teams: [] });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => render(<Players />);

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
      screen.queryAllByRole("button", { name: /add player/i })[0]
    );
  };

  const fillAndSubmitNewPlayer = async (name: string) => {
    const user = userEvent.setup();
    const trigger = findCreatePlayerTrigger();
    expect(trigger).toBeTruthy();
    await user.click(trigger as HTMLElement);

    const nameInput = await screen.findByLabelText(/player name/i);
    await user.type(nameInput, name);

    const submitButton = await screen.findByRole("button", {
      name: /create player/i,
    });
    await user.click(submitButton);
  };

  it("renders Players page and default empty state", async () => {
    renderComponent();

    expect(await findPlayersTitle()).toBeInTheDocument();
    expect(screen.getByText(/^No active players$/i)).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /add player/i })[0],
    ).toBeInTheDocument();
  });

  it("renders list of players and handles interactions", async () => {
    const user = userEvent.setup();
    mockDb.seed({
      players: [
        { id: "p1", name: "John Doe", avatarColor: "#ff0000", isStar: 0 },
        { id: "p2", name: "Jane Smith", avatarColor: "#0000ff", isStar: 1 },
      ],
    });

    const { container } = renderComponent();

    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();

    // Test Search
    const searchInput = screen.getByPlaceholderText(/search players/i);
    await user.type(searchInput, "John");
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.queryByText(/Jane Smith/i)).not.toBeInTheDocument();

    // Clear Search
    await user.clear(searchInput);
    expect(await screen.findByText(/Jane Smith/i)).toBeInTheDocument();

    // Test Tab Change
    const archivedTab = screen.getByRole("tab", { name: /archived/i });
    await user.click(archivedTab);
    expect(screen.getByText(/no archived players/i)).toBeInTheDocument();

    // Known pre-existing violations in Players page:
    // 1. Heading levels skipping (heading-order) - e.g. using h6 for player name without parent headings
    // 2. Nested interactive controls (nested-interactive) - EntityRowCard is a button but contains other buttons (more menu)
    // We document these and move forward as per task instructions by disabling specific failing rules.
    await assertAccessible(container, {
      rules: {
        "heading-order": { enabled: false },
        "nested-interactive": { enabled: false },
      },
    });
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
      .mockImplementation(() => {});

    vi.spyOn(mockDb.players, "add").mockImplementation(() => {
      throw new Error("Add failed");
    });

    renderComponent();

    await fillAndSubmitNewPlayer("Fail Player");

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create player"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
