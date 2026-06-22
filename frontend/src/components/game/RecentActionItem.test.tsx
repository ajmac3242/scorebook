import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import RecentActionItem from "./RecentActionItem";
import React from "react";
import { ACTION_TYPES } from "../../constants/stats";
import { StatEvent } from "../../db";

describe("RecentActionItem", () => {
  const mockStat: StatEvent = {
    id: "stat-1",
    gameId: "game-1",
    playerId: "player-1",
    type: ACTION_TYPES.MAKE,
    period: 1,
    clockTime: 600,
    timestamp: new Date().toISOString(),
    synced: 0,
  };

  const defaultProps = {
    stat: mockStat,
    playerName: "John Doe",
    periodLabel: "Quarter",
    isReadOnly: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stat info correctly", () => {
    render(<RecentActionItem {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/MAKE/)).toBeInTheDocument();
    expect(screen.getByText(/Quarter 1 @ 10:00/)).toBeInTheDocument();
  });

  it("calls onEdit when clicked", async () => {
    const user = userEvent.setup();
    render(<RecentActionItem {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /Action:/ }));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it("calls onEdit when edit button is pressed", async () => {
    const user = userEvent.setup();
    render(<RecentActionItem {...defaultProps} />);
    await user.click(screen.getByLabelText(/edit MAKE for John Doe/));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it("calls onDelete when delete button is pressed", async () => {
    const user = userEvent.setup();
    render(<RecentActionItem {...defaultProps} />);

    await user.click(screen.getByLabelText(/delete MAKE for John Doe/));
    expect(defaultProps.onDelete).toHaveBeenCalledWith("stat-1");
  });

  it("renders different icons based on action type", () => {
    const types = [
        ACTION_TYPES.MISS,
        ACTION_TYPES.REBOUND,
        ACTION_TYPES.ASSIST,
        ACTION_TYPES.STEAL,
        ACTION_TYPES.TURNOVER,
        ACTION_TYPES.BLOCK,
        ACTION_TYPES.FOUL,
        ACTION_TYPES.TIMEOUT,
        ACTION_TYPES.SUB_IN,
        ACTION_TYPES.POSSESSION
    ];

    const { rerender } = render(<RecentActionItem {...defaultProps} />);

    types.forEach(type => {
        rerender(<RecentActionItem {...defaultProps} stat={{ ...mockStat, type }} />);
        expect(screen.getByLabelText(type.toLowerCase())).toBeInTheDocument();
    });
  });

  it("disables buttons when isReadOnly is true", () => {
     render(<RecentActionItem {...defaultProps} isReadOnly={true} />);
     expect(screen.getByLabelText(/edit MAKE/)).toBeDisabled();
     expect(screen.getByLabelText(/delete MAKE/)).toBeDisabled();
  });

  it("highlights if isLatest is true", () => {
    render(<RecentActionItem {...defaultProps} isLatest={true} />);
    const item = screen.getByRole("button", { name: /Action:/ });
    expect(item).toBeInTheDocument();
  });

  it("handles keyboard interaction", async () => {
      const user = userEvent.setup();
      render(<RecentActionItem {...defaultProps} />);
      const item = screen.getByRole("button", { name: /Action:/ });
      item.focus();
      await user.keyboard("{Enter}");
      expect(defaultProps.onEdit).toHaveBeenCalled();
  });
});
