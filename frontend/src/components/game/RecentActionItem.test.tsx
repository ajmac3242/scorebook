import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
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

  it("renders different icon types appropriately (e.g., MISS, REBOUND)", async () => {
    const missStat = { ...mockStat, type: ACTION_TYPES.MISS };
    render(<RecentActionItem {...defaultProps} stat={missStat} />, {
      withAuth: false,
    });
    expect(screen.getByLabelText("miss")).toBeInTheDocument();

    const reboundStat = { ...mockStat, type: ACTION_TYPES.REBOUND };
    render(<RecentActionItem {...defaultProps} stat={reboundStat} />, {
      withAuth: false,
    });
    expect(screen.getByLabelText("rebound")).toBeInTheDocument();
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
});
