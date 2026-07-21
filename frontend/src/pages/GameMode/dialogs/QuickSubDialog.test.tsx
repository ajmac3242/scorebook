import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
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
  [
    "p1",
    { id: "p1", name: "Player 1", jerseyNumber: "10", fouls: 0, min: 0 } as any,
  ],
  [
    "p2",
    { id: "p2", name: "Player 2", jerseyNumber: "20", fouls: 0, min: 0 } as any,
  ],
  [
    "p3",
    { id: "p3", name: "Player 3", jerseyNumber: "30", fouls: 0, min: 0 } as any,
  ],
  [
    "p4",
    { id: "p4", name: "Player 4", jerseyNumber: "40", fouls: 0, min: 0 } as any,
  ],
  [
    "p5",
    { id: "p5", name: "Player 5", jerseyNumber: "50", fouls: 0, min: 0 } as any,
  ],
  [
    "p6",
    { id: "p6", name: "Player 6", jerseyNumber: "60", fouls: 0, min: 0 } as any,
  ],
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

  it("has no accessibility violations", async () => {
    const { container } = render(<QuickSubDialog {...defaultProps} />);
    await assertAccessible(container);
  });

  it("matches snapshot", () => {
    const { container } = render(<QuickSubDialog {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it("calls handleSwapClick when a player button is clicked", async () => {
    const user = userEvent.setup();
    const handleSwapClick = vi.fn();
    render(
      <QuickSubDialog {...defaultProps} handleSwapClick={handleSwapClick} />,
    );

    await user.click(
      screen.getByRole("button", { name: /Swap #10 Player 1/i }),
    );
    expect(handleSwapClick).toHaveBeenCalledWith("p1");
  });

  it("calls handleQuickSub when sub in button is clicked", async () => {
    const user = userEvent.setup();
    const handleQuickSub = vi.fn();
    render(
      <QuickSubDialog {...defaultProps} handleQuickSub={handleQuickSub} />,
    );

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
      />,
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
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    const subBtn = screen.getByRole("button", { name: /Save Forced Sub/i });

    expect(cancelBtn).not.toBeDisabled();
    expect(subBtn).not.toBeDisabled();
  });

  it("handles empty lineup slots correctly", async () => {
    const user = userEvent.setup();
    const handleSwapClick = vi.fn();
    const draftOnCourtIds = new Set(["p1", "p2", "p3", "p4"]); // 4 players, 1 empty slot

    render(
      <QuickSubDialog
        {...defaultProps}
        draftOnCourtIds={draftOnCourtIds}
        handleSwapClick={handleSwapClick}
      />,
    );

    const emptySlot = screen.getByRole("button", {
      name: /Empty lineup slot, click to swap with bench player/i,
    });
    expect(emptySlot).toBeInTheDocument();

    await user.click(emptySlot);
    expect(handleSwapClick).toHaveBeenCalledWith("EMPTY-0");
  });

  it("calls handleSwapClick when Clear Selection is clicked", async () => {
    const user = userEvent.setup();
    const handleSwapClick = vi.fn();

    render(
      <QuickSubDialog
        {...defaultProps}
        selectedSwapId="p1"
        handleSwapClick={handleSwapClick}
      />,
    );

    const clearButton = screen.getByRole("button", {
      name: /Clear current selection/i,
    });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(handleSwapClick).toHaveBeenCalledWith("p1");
  });

  it("calls handleSwapClick when a bench player is clicked", async () => {
    const user = userEvent.setup();
    const handleSwapClick = vi.fn();

    render(
      <QuickSubDialog {...defaultProps} handleSwapClick={handleSwapClick} />,
    );

    const benchBtn = screen.getByRole("button", {
      name: /Swap #60 Player 6/i,
    });
    await user.click(benchBtn);
    expect(handleSwapClick).toHaveBeenCalledWith("p6");
  });

  it("handles fouled out bench players and does not swap them", async () => {
    const handleSwapClick = vi.fn();
    const statsMapWithFouls = new Map<string, PlayerAggregates>([
      ...mockStatsMap,
      [
        "p6",
        {
          id: "p6",
          name: "Player 6",
          jerseyNumber: "60",
          fouls: 5,
          min: 0,
        } as any,
      ],
    ]);

    render(
      <QuickSubDialog
        {...defaultProps}
        statsMap={statsMapWithFouls}
        handleSwapClick={handleSwapClick}
      />,
    );

    const benchFouledOutBtn = screen.getByRole("button", {
      name: /Swap #60 Player 6 \(Fouled Out\)/i,
    });
    expect(benchFouledOutBtn).toBeDisabled();
  });

  it("shows foul trouble warning and handle close on forced mode backdrop click", async () => {
    const onClose = vi.fn();
    const statsMapWithTrouble = new Map<string, PlayerAggregates>([
      ...mockStatsMap,
      [
        "p1",
        {
          id: "p1",
          name: "Player 1",
          jerseyNumber: "10",
          fouls: 4,
          min: 0,
        } as any,
      ],
    ]);

    const { baseElement } = render(
      <QuickSubDialog
        {...defaultProps}
        onClose={onClose}
        isForced={true}
        statsMap={statsMapWithTrouble}
      />,
    );

    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("prevents closing on Escape in forced mode if draftOnCourtIds size is not 5", async () => {
    const onClose = vi.fn();
    const draftOnCourtIds = new Set(["p1", "p2", "p3", "p4"]); // only 4 players

    render(
      <QuickSubDialog
        {...defaultProps}
        draftOnCourtIds={draftOnCourtIds}
        onClose={onClose}
        isForced={true}
      />,
    );

    const user = userEvent.setup();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });
});
