import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
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

  it("has no accessibility violations when open", async () => {
    const { container } = render(<JumpBallDialog {...defaultProps} />);
    await assertAccessible(container);
  });

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

  it("handles async onSelectWinner and disables buttons while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const asyncSelectWinner = vi.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
    });

    render(
      <JumpBallDialog {...defaultProps} onSelectWinner={asyncSelectWinner} />,
    );

    const ourTeamButton = screen.getByRole("button", { name: "Our Team" });
    const oppTeamButton = screen.getByRole("button", { name: "Opponent Team" });

    await user.click(ourTeamButton);

    expect(ourTeamButton).toBeDisabled();
    expect(oppTeamButton).toBeDisabled();
    expect(asyncSelectWinner).toHaveBeenCalledWith(SPECIAL_PLAYER_IDS.OUR_TEAM);

    await React.act(async () => {
      resolvePromise!();
    });
  });

  it("calls onSelectWinner with OPPONENT when opponent button is clicked", async () => {
    const user = userEvent.setup();
    render(<JumpBallDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Opponent Team" }));
    expect(mockOnSelectWinner).toHaveBeenCalledWith(
      SPECIAL_PLAYER_IDS.OPPONENT,
    );
  });

  it("invokes onStartClock callback when tip-off winner is selected (Opening Tip Clock Auto-Start Interlock)", async () => {
    const user = userEvent.setup();
    const mockOnStartClock = vi.fn();
    render(
      <JumpBallDialog {...defaultProps} onStartClock={mockOnStartClock} />,
    );

    await user.click(screen.getByRole("button", { name: "Our Team" }));
    expect(mockOnStartClock).toHaveBeenCalledTimes(1);
  });
});
