import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../../test-utils";
import QuickSubDialog from "./QuickSubDialog";
import React from "react";
import { Player } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats";

const mockPlayers: Player[] = [
  { id: "p1", name: "Player 1", avatarColor: "blue" },
  { id: "p2", name: "Player 2" },
  { id: "p3", name: "Player 3" },
  { id: "p4", name: "Player 4" },
  { id: "p5", name: "Player 5" },
  { id: "p6", name: "Player 6" },
];

const mockJerseyMap = new Map([
  ["p1", "10"],
  ["p2", "20"],
  ["p3", "30"],
  ["p4", "40"],
  ["p5", "50"],
  ["p6", "60"],
]);

const mockStatsMap = new Map<string, PlayerAggregates>([
  ["p1", { id: "p1", name: "Player 1", jerseyNumber: "10", fouls: 0, min: 0 } as any],
  ["p2", { id: "p2", name: "Player 2", jerseyNumber: "20", fouls: 0, min: 0 } as any],
  ["p3", { id: "p3", name: "Player 3", jerseyNumber: "30", fouls: 0, min: 0 } as any],
  ["p4", { id: "p4", name: "Player 4", jerseyNumber: "40", fouls: 0, min: 0 } as any],
  ["p5", { id: "p5", name: "Player 5", jerseyNumber: "50", fouls: 0, min: 0 } as any],
  ["p6", { id: "p6", name: "Player 6", jerseyNumber: "60", fouls: 0, min: 0 } as any],
]);

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  players: mockPlayers,
  team: { id: "t1", name: "My Team", defaultFoulLimit: 5 } as any,
  game: { id: "g1", foulLimit: 5 } as any,
  draftOnCourtIds: new Set(["p1", "p2", "p3", "p4", "p5"]),
  selectedSwapId: null,
  statsMap: mockStatsMap,
  jerseyMap: mockJerseyMap,
  handleSwapClick: vi.fn(),
  handleQuickSub: vi.fn(),
};

describe("QuickSubDialog", () => {
  it("renders correctly with on-court and bench players", () => {
    render(<QuickSubDialog {...defaultProps} />);

    expect(screen.getByText("Quick Substitution")).toBeInTheDocument();
    expect(screen.getByText("#10 Player 1")).toBeInTheDocument();
    expect(screen.getByText("#60 Player 6")).toBeInTheDocument();
  });

  it("calls handleSwapClick when a player button is clicked", async () => {
    const user = userEvent.setup();
    const handleSwapClick = vi.fn();
    render(<QuickSubDialog {...defaultProps} handleSwapClick={handleSwapClick} />);

    await user.click(screen.getByRole("button", { name: /Swap #10 Player 1/i }));
    expect(handleSwapClick).toHaveBeenCalledWith("p1");
  });

  it("calls handleQuickSub when sub in button is clicked", async () => {
    const user = userEvent.setup();
    const handleQuickSub = vi.fn();
    render(<QuickSubDialog {...defaultProps} handleQuickSub={handleQuickSub} />);

    await user.click(screen.getByRole("button", { name: /Sub In/i }));
    expect(handleQuickSub).toHaveBeenCalled();
  });

  it("disables Cancel and Sub In buttons in forced mode if draft is illegal (size !== 5)", () => {
    const draftOnCourtIds = new Set(["p1", "p2", "p3", "p4"]); // only 4 players (draft illegal)
    render(
      <QuickSubDialog
        {...defaultProps}
        draftOnCourtIds={draftOnCourtIds}
        isForced={true}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    const subBtn = screen.getByRole("button", { name: /Save Forced Sub/i });

    expect(cancelBtn).toBeDisabled();
    expect(subBtn).toBeDisabled();
  });

  it("enables Cancel and Sub In buttons in forced mode if draft is legal (size === 5)", () => {
    const draftOnCourtIds = new Set(["p1", "p2", "p3", "p4", "p6"]); // 5 players (draft legal)
    render(
      <QuickSubDialog
        {...defaultProps}
        draftOnCourtIds={draftOnCourtIds}
        isForced={true}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    const subBtn = screen.getByRole("button", { name: /Save Forced Sub/i });

    expect(cancelBtn).not.toBeDisabled();
    expect(subBtn).not.toBeDisabled();
  });
});
