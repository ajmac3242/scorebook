import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PlayerWorkflowDialog from "./PlayerWorkflowDialog";
import { mockDb } from "../../dbMock";
import { AVATAR_COLORS } from "../../constants/colors";

// Mock the sync service so it doesn't try to connect to a real server
vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("PlayerWorkflowDialog", () => {
  const handleClose = vi.fn();
  const handleSuccess = vi.fn();
  const handleError = vi.fn();

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onClose: handleClose,
    mode: "create" as const,
    onSuccess: handleSuccess,
    onError: handleError,
  };

  it("renders the first step (Identity) correctly", async () => {
    const { container } = render(<PlayerWorkflowDialog {...defaultProps} />, {
      withAuth: false,
    });

    expect(screen.getByText("Create player")).toBeInTheDocument();
    expect(screen.getByLabelText("Player name")).toBeInTheDocument();
    expect(screen.getByText("Star player")).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("validates player name input when trying to continue", async () => {
    const user = userEvent.setup();
    render(<PlayerWorkflowDialog {...defaultProps} />, {
      withAuth: false,
    });

    // Try to click continue without entering a name
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    expect(screen.getByText("Player name is required")).toBeInTheDocument();
  });

  it("progresses through the workflow and submits successfully", async () => {
    // Seed some teams
    await mockDb.teams.add({
      id: "team-1",
      name: "Celtics",
      isArchived: 0,
      isFavorite: 1,
    } as any);
    await mockDb.teams.add({
      id: "team-2",
      name: "Lakers",
      isArchived: 0,
      isFavorite: 0,
    } as any);

    const user = userEvent.setup();
    const { container } = render(<PlayerWorkflowDialog {...defaultProps} />, {
      withAuth: false,
    });

    // Step 1: Identity
    const nameInput = screen.getByLabelText("Player name");
    await user.type(nameInput, "Jayson Tatum");

    // Toggle star player switch
    const starSwitch = screen.getByRole("switch", { name: /star player/i });
    await user.click(starSwitch);

    let continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 2: Appearance
    expect(screen.getByText("Avatar color")).toBeInTheDocument();
    // Select an avatar color
    const colorPickers = screen.getAllByRole("radio");
    await user.click(colorPickers[1]);

    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 3: Teams
    expect(
      screen.getByText(
        "Assign this player to one or more teams and optionally set a jersey number for each roster.",
      ),
    ).toBeInTheDocument();

    // Check Celtic and Lakers team checkbox
    const team1Checkbox = screen.getByRole("checkbox", {
      name: /Assign Jayson Tatum to Celtics/i,
    });
    await user.click(team1Checkbox);

    // Enter jersey number for Celtics
    const jerseyInputs = screen.getAllByLabelText("#");
    expect(jerseyInputs[0]).not.toBeDisabled();
    await user.type(jerseyInputs[0], "0");

    // Filter teams by search
    const searchInput = screen.getByPlaceholderText("Search teams");
    await user.type(searchInput, "Lake");
    expect(screen.queryByText("Celtics")).not.toBeInTheDocument();
    expect(screen.getByText("Lakers")).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 4: Review
    expect(
      screen.getByText(
        "Review the player details before creating. You can edit everything later.",
      ),
    ).toBeInTheDocument();

    // There are multiple "Jayson Tatum" because of the preview component and the table review
    const matchingNames = screen.getAllByText("Jayson Tatum");
    expect(matchingNames.length).toBeGreaterThan(0);
    expect(screen.getByText("Star player")).toBeInTheDocument();

    // Submit
    const submitBtn = screen.getByRole("button", { name: /create player/i });
    await user.click(submitBtn);

    expect(handleSuccess).toHaveBeenCalledWith("Player added successfully!");
    expect(handleClose).toHaveBeenCalled();

    // Check IndexedDB
    const players = await mockDb.players.toArray();
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe("Jayson Tatum");
    expect(players[0].isStar).toBe(1);

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(1);
    expect(teamPlayers[0].teamId).toBe("team-1");
    expect(teamPlayers[0].jerseyNumber).toBe("0");
  });

  it("handles edit mode and updates player successfully", async () => {
    // Seed initial player and team
    await mockDb.players.add({
      id: "player-1",
      name: "LeBron James",
      avatarColor: AVATAR_COLORS[0],
      isStar: 1,
      isArchived: 0,
    } as any);

    await mockDb.teams.add({
      id: "team-1",
      name: "Lakers",
      isArchived: 0,
      isFavorite: 1,
    } as any);

    await mockDb.teamPlayers.add({
      id: "tp-1",
      playerId: "player-1",
      teamId: "team-1",
      jerseyNumber: "23",
      name: "LeBron James",
      avatarColor: AVATAR_COLORS[0],
    } as any);

    const user = userEvent.setup();
    const { container } = render(
      <PlayerWorkflowDialog
        {...defaultProps}
        mode="edit"
        playerId="player-1"
        player={{
          id: "player-1",
          name: "LeBron James",
          avatarColor: AVATAR_COLORS[0],
          isStar: 1,
          isArchived: 0,
        }}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Edit player")).toBeInTheDocument();

    // Edit Name
    const nameInput = screen.getByLabelText("Player name");
    await user.clear(nameInput);
    await user.type(nameInput, "King James");

    let continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 2: Appearance
    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 3: Teams
    // Unassign team-1 (using updated name)
    const checkbox = screen.getByRole("checkbox", {
      name: /Assign King James to Lakers/i,
    });
    await user.click(checkbox);

    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 4: Review
    const submitBtn = screen.getByRole("button", { name: /save changes/i });
    await user.click(submitBtn);

    expect(handleSuccess).toHaveBeenCalledWith("Player updated successfully!");

    const updatedPlayer = await mockDb.players.get("player-1");
    expect(updatedPlayer?.name).toBe("King James");

    const teamPlayers = await mockDb.teamPlayers.toArray();
    expect(teamPlayers).toHaveLength(0); // Should be deleted since we unchecked it
  });

  it("shows error if submission fails", async () => {
    vi.spyOn(mockDb.players, "add").mockRejectedValueOnce(
      new Error("DB Error"),
    );

    const user = userEvent.setup();
    render(<PlayerWorkflowDialog {...defaultProps} />, {
      withAuth: false,
    });

    const nameInput = screen.getByLabelText("Player name");
    await user.type(nameInput, "Failing Player");

    // Step 1 -> Step 2
    let continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 2 -> Step 3
    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Step 3 -> Step 4
    continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Submit
    const submitBtn = screen.getByRole("button", { name: /create player/i });
    await user.click(submitBtn);

    expect(screen.getByText("Failed to add player")).toBeInTheDocument();
    expect(handleError).toHaveBeenCalledWith("Failed to add player");
  });
});
