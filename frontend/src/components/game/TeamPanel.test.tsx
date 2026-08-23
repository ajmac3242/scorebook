import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  assertAccessible,
  screen,
  act,
} from "../../test-utils";
import { TeamPanel, TeamPanelProps } from "./TeamPanel";

const defaultProps: TeamPanelProps = {
  name: "Celtics",
  logoUrl: "https://example.com/logo.png",
  score: 88,
  timeouts: 2,
  timeoutTotal: 3,
  isOpponent: false,
  fouls: 4,
  foulColor: "#ff0000",
  bonusLabel: "BONUS",
  isDouble: false,
  ftg: 2,
  onCourtFouls: [
    { jersey: "0", fouls: 2 },
    { jersey: "7", fouls: 4 },
    { jersey: "11", fouls: 5 },
    { jersey: "A1", fouls: 1 },
  ],
  foulLimit: 5,
};

describe("TeamPanel", () => {
  it("renders team name, avatar, score, timeouts, and fouls correctly", async () => {
    const { container } = await act(async () => {
      return render(<TeamPanel {...defaultProps} />);
    });

    await assertAccessible(container);

    expect(screen.getByText("Celtics")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("FOULS: 4")).toBeInTheDocument();
    expect(screen.getByText("BONUS")).toBeInTheDocument();
    expect(screen.getByTestId("team-bonus-indicator")).toBeInTheDocument();
  });

  it("renders double bonus indicator light when in double bonus", async () => {
    const { container } = await act(async () => {
      return render(
        <TeamPanel {...defaultProps} bonusLabel="DBL BONUS" isDouble={true} />,
      );
    });

    await assertAccessible(container);

    expect(screen.getByText("DOUBLE BONUS")).toBeInTheDocument();
    const indicator = screen.getByTestId("team-bonus-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("aria-label", "Celtics in double bonus");
  });

  it("handles score click when onScoreClick is provided and not read-only", async () => {
    const user = userEvent.setup();
    const onScoreClick = vi.fn();

    await act(async () => {
      render(<TeamPanel {...defaultProps} onScoreClick={onScoreClick} />);
    });

    const scoreButton = screen.getByRole("button", {
      name: /Celtics score: 88/i,
    });
    await user.click(scoreButton);
    expect(onScoreClick).toHaveBeenCalledTimes(1);

    scoreButton.focus();
    await user.keyboard("{Enter}");
    expect(onScoreClick).toHaveBeenCalledTimes(2);

    await user.keyboard(" ");
    expect(onScoreClick).toHaveBeenCalledTimes(3);
  });

  it("does not trigger onScoreClick when isReadOnly is true", async () => {
    const user = userEvent.setup();
    const onScoreClick = vi.fn();

    await act(async () => {
      render(
        <TeamPanel
          {...defaultProps}
          isReadOnly={true}
          onScoreClick={onScoreClick}
        />,
      );
    });

    expect(
      screen.queryByRole("button", { name: /Celtics score: 88/i }),
    ).not.toBeInTheDocument();
  });

  it("renders FTG indicator when bonusLabel is omitted and ftg > 0", async () => {
    await act(async () => {
      render(<TeamPanel {...defaultProps} bonusLabel={undefined} ftg={3} />);
    });

    expect(screen.getByText("FTG: 3")).toBeInTheDocument();
  });

  it("renders opponent layout and sorts non-numeric jersey fouls appropriately", async () => {
    await act(async () => {
      render(
        <TeamPanel
          {...defaultProps}
          isOpponent={true}
          bonusLabel={undefined}
          ftg={0}
          onCourtFouls={[
            { jersey: "B", fouls: 1 },
            { jersey: "A", fouls: 2 },
          ]}
        />,
      );
    });

    expect(screen.getByText("Celtics")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
