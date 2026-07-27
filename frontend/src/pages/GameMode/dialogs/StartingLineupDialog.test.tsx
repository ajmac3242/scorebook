import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../../test-utils";
import { StartingLineupDialog } from "./StartingLineupDialog";
import { Player } from "../../../db";

describe("StartingLineupDialog", () => {
  const mockOnConfirm = vi.fn();

  const mockPlayers: Player[] = [
    { id: "p1", name: "Alice", avatarColor: "red" },
    { id: "p2", name: "Bob", avatarColor: "blue" },
    { id: "p3", name: "Charlie", avatarColor: "green" },
    { id: "p4", name: "David", avatarColor: "yellow" },
    { id: "p5", name: "Eve", avatarColor: "purple" },
    { id: "p6", name: "Frank", avatarColor: "orange" },
  ];

  const mockJerseyMap = new Map<string, string | undefined>([
    ["p1", "1"],
    ["p2", "2"],
    ["p3", "3"],
    ["p4", "4"],
    ["p5", "5"],
    ["p6", "6"],
  ]);

  const defaultProps = {
    open: true,
    players: mockPlayers,
    jerseyMap: mockJerseyMap,
    onConfirm: mockOnConfirm,
  };

  beforeEach(() => {
    mockOnConfirm.mockClear();
  });

  it("renders a header and lists all players with jersey numbers", () => {
    render(<StartingLineupDialog {...defaultProps} />);

    expect(screen.getByText("Verify Starting Lineup")).toBeInTheDocument();
    expect(screen.getByText("0 of 5 Selected")).toBeInTheDocument();

    expect(screen.getByText("#1 Alice")).toBeInTheDocument();
    expect(screen.getByText("#2 Bob")).toBeInTheDocument();
    expect(screen.getByText("#6 Frank")).toBeInTheDocument();
  });

  it("allows selecting players up to 5", async () => {
    const user = userEvent.setup();
    render(<StartingLineupDialog {...defaultProps} />);

    // Click first 5 players
    await user.click(screen.getByText("#1 Alice"));
    expect(screen.getByText("1 of 5 Selected")).toBeInTheDocument();

    await user.click(screen.getByText("#2 Bob"));
    await user.click(screen.getByText("#3 Charlie"));
    await user.click(screen.getByText("#4 David"));
    await user.click(screen.getByText("#5 Eve"));

    expect(screen.getByText("5 of 5 Selected")).toBeInTheDocument();

    // Verify that the 6th player (Frank) is now disabled
    expect(screen.getByRole("button", { name: /#6 Frank/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("disables the confirm button unless exactly 5 players are selected", async () => {
    const user = userEvent.setup();
    render(<StartingLineupDialog {...defaultProps} />);

    const confirmButton = screen.getByRole("button", {
      name: "Confirm Starting Lineup",
    });
    expect(confirmButton).toBeDisabled();

    // Select 4 players
    await user.click(screen.getByText("#1 Alice"));
    await user.click(screen.getByText("#2 Bob"));
    await user.click(screen.getByText("#3 Charlie"));
    await user.click(screen.getByText("#4 David"));
    expect(confirmButton).toBeDisabled();

    // Select 5th player
    await user.click(screen.getByText("#5 Eve"));
    expect(confirmButton).toBeEnabled();

    // De-select 1 player
    await user.click(screen.getByText("#3 Charlie"));
    expect(confirmButton).toBeDisabled();
  });

  it("calls onConfirm with the selected Set of IDs when clicking confirm", async () => {
    const user = userEvent.setup();
    render(<StartingLineupDialog {...defaultProps} />);

    await user.click(screen.getByText("#1 Alice"));
    await user.click(screen.getByText("#2 Bob"));
    await user.click(screen.getByText("#3 Charlie"));
    await user.click(screen.getByText("#4 David"));
    await user.click(screen.getByText("#5 Eve"));

    const confirmButton = screen.getByRole("button", {
      name: "Confirm Starting Lineup",
    });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    const arg = mockOnConfirm.mock.calls[0][0] as Set<string>;
    expect(arg.size).toBe(5);
    expect(arg.has("p1")).toBe(true);
    expect(arg.has("p2")).toBe(true);
    expect(arg.has("p3")).toBe(true);
    expect(arg.has("p4")).toBe(true);
    expect(arg.has("p5")).toBe(true);
    expect(arg.has("p6")).toBe(false);
  });
});
