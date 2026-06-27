import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../../test-utils";
import { JumpBallDialog } from "./JumpBallDialog";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import React from "react";

describe("JumpBallDialog", () => {
  const mockOnSelectWinner = vi.fn();
  const defaultProps = {
    open: true,
    teamName: "Our Team",
    opponentName: "Opponent Team",
    onSelectWinner: mockOnSelectWinner,
  };

  it("renders team names", () => {
    render(<JumpBallDialog {...defaultProps} />);
    expect(screen.getByText("Our Team")).toBeInTheDocument();
    expect(screen.getByText("Opponent Team")).toBeInTheDocument();
  });

  it("calls onSelectWinner with OUR_TEAM when our team button is clicked", async () => {
    const user = userEvent.setup();
    render(<JumpBallDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Our Team" }));
    expect(mockOnSelectWinner).toHaveBeenCalledWith(
      SPECIAL_PLAYER_IDS.OUR_TEAM,
    );
  });

  it("calls onSelectWinner with OPPONENT when opponent button is clicked", async () => {
    const user = userEvent.setup();
    render(<JumpBallDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Opponent Team" }));
    expect(mockOnSelectWinner).toHaveBeenCalledWith(
      SPECIAL_PLAYER_IDS.OPPONENT,
    );
  });
});
