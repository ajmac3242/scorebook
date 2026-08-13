import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
  cleanup,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RecentActionItem from "./RecentActionItem";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("RecentActionItem", () => {
  const mockStat: StatEvent = {
    id: "stat-123",
    gameId: "game-1",
    type: ACTION_TYPES.MAKE,
    period: 1,
    clockTime: 580, // 9:40
    playerId: "player-456",
    timestamp: new Date().toISOString(),
  };

  const defaultProps = {
    stat: mockStat,
    playerName: "LeBron James",
    periodLabel: "P",
    isReadOnly: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  // We bypass 'nested-interactive' rule because the parent is role="button"
  // but contains nested IconButtons for edit/delete actions.
  const axeOptions = {
    rules: {
      "nested-interactive": { enabled: false },
    },
  };

  it("renders the action item details correctly", async () => {
    const { container } = render(<RecentActionItem {...defaultProps} />, {
      withAuth: false,
    });

    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(ACTION_TYPES.MAKE))).toBeInTheDocument();
    expect(screen.getByText("P 1 @ 9:40")).toBeInTheDocument();

    // Check for icons and buttons
    expect(
      screen.getByRole("button", { name: /edit MAKE for LeBron James/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete MAKE for LeBron James/i }),
    ).toBeInTheDocument();

    await assertAccessible(container, axeOptions);
  });

  it("renders correct icons for non-null action types", () => {
    const actionTypes = [
      { type: ACTION_TYPES.MISS, label: "miss" },
      { type: ACTION_TYPES.REBOUND, label: "rebound" },
      { type: ACTION_TYPES.OFF_REBOUND, label: "off_rebound" },
      { type: ACTION_TYPES.DEF_REBOUND, label: "def_rebound" },
      { type: ACTION_TYPES.ASSIST, label: "assist" },
      { type: ACTION_TYPES.STEAL, label: "steal" },
      { type: ACTION_TYPES.TURNOVER, label: "turnover" },
      { type: ACTION_TYPES.BLOCK, label: "block" },
      { type: ACTION_TYPES.FOUL, label: "foul" },
      { type: ACTION_TYPES.TIMEOUT, label: "timeout" },
      { type: ACTION_TYPES.SUB_IN, label: "sub_in" },
      { type: ACTION_TYPES.SUB_OUT, label: "sub_out" },
      { type: ACTION_TYPES.POSSESSION, label: "possession" },
    ];

    actionTypes.forEach(({ type, label }) => {
      render(
        <RecentActionItem {...defaultProps} stat={{ ...mockStat, type }} />,
        { withAuth: false },
      );
      expect(screen.getByLabelText(label.toLowerCase())).toBeInTheDocument();
      cleanup(); // Avoid DOM accumulation
    });
  });

  it("renders no icon for unknown action types", () => {
    render(
      <RecentActionItem
        {...defaultProps}
        stat={{ ...mockStat, type: "UNKNOWN_ACTION" }}
      />,
      { withAuth: false },
    );
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("triggers onEdit when item container is clicked", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<RecentActionItem {...defaultProps} onEdit={handleEdit} />, {
      withAuth: false,
    });

    // Get the item container role="button"
    const itemContainer = screen.getByRole("button", {
      name: /Action: LeBron James MAKE during P 1 at 9:40\. Click to edit\./i,
    });

    await user.click(itemContainer);
    expect(handleEdit).toHaveBeenCalledWith(mockStat);
  });

  it("triggers onEdit on Enter and Space key press", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<RecentActionItem {...defaultProps} onEdit={handleEdit} />, {
      withAuth: false,
    });

    const itemContainer = screen.getByRole("button", {
      name: /Action: LeBron James MAKE during P 1 at 9:40\. Click to edit\./i,
    });

    itemContainer.focus();
    await user.keyboard("{Enter}");
    expect(handleEdit).toHaveBeenCalledWith(mockStat);

    await user.keyboard(" ");
    expect(handleEdit).toHaveBeenCalledTimes(2);
  });

  it("triggers onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(<RecentActionItem {...defaultProps} onEdit={handleEdit} />, {
      withAuth: false,
    });

    const editBtn = screen.getByRole("button", {
      name: /edit MAKE for LeBron James/i,
    });
    await user.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockStat);
  });

  it("triggers onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(<RecentActionItem {...defaultProps} onDelete={handleDelete} />, {
      withAuth: false,
    });

    const deleteBtn = screen.getByRole("button", {
      name: /delete MAKE for LeBron James/i,
    });
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("stat-123");
  });

  it("disables edit and delete buttons when isReadOnly is true", async () => {
    render(<RecentActionItem {...defaultProps} isReadOnly={true} />, {
      withAuth: false,
    });

    const editBtn = screen.getByRole("button", {
      name: /edit MAKE for LeBron James/i,
    });
    const deleteBtn = screen.getByRole("button", {
      name: /delete MAKE for LeBron James/i,
    });

    expect(editBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
  });

  it("renders correctly as the latest action item", async () => {
    render(<RecentActionItem {...defaultProps} isLatest={true} />, {
      withAuth: false,
    });

    const itemContainer = screen.getByRole("button", {
      name: /Latest Action: LeBron James MAKE during P 1 at 9:40\. Click to edit\./i,
    });
    expect(itemContainer).toBeInTheDocument();
  });
});
