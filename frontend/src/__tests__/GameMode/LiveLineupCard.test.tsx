import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import {
  renderWithProviders as render,
  screen,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { LiveLineupCard } from "../../pages/GameMode/LiveLineupCard";

const mockPlayer = (id: string) => ({ id, name: `Player ${id}` }) as any;

const defaultProps = {
  players: [mockPlayer("p1"), mockPlayer("p2")],
  onCourtIds: new Set(["p1"]),
  game: { foulLimit: 5 } as any,
  team: { maxStintDuration: 8 } as any,
  statsMap: new Map(),
  jerseyMap: new Map([["p1", "23"]]),
  currentLineupStintDuration: 300,
  currentLineupPlusMinus: 5,
  period: 1,
  isReadOnly: false,
  chainPrompt: null,
  onPlayerClick: vi.fn(),
  onEmptySlotClick: vi.fn(),
  onChainAction: vi.fn(),
  onDismissChain: vi.fn(),
};

describe("LiveLineupCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches snapshot", () => {
    /**
     * This snapshot protects the live game HUD structure, including player button layout,
     * stint timers, net impact display, and the conditional chain action prompt.
     */
    const { container } = render(<LiveLineupCard {...defaultProps} />);
    expect(container).toMatchSnapshot("LiveLineupCard default render");
  });

  it("renders Live Lineup header text", () => {
    render(<LiveLineupCard {...defaultProps} />);
    expect(screen.getByText(/live lineup/i)).toBeInTheDocument();
  });

  it("renders player button for on-court player", () => {
    render(<LiveLineupCard {...defaultProps} />);
    expect(screen.getByText("Player p1")).toBeInTheDocument();
  });

  it("calls onPlayerClick when player button is clicked", async () => {
    const user = userEvent.setup();
    render(<LiveLineupCard {...defaultProps} />);
    await user.click(screen.getByText("Player p1"));
    expect(defaultProps.onPlayerClick).toHaveBeenCalledWith("p1");
  });

  it("renders chain prompt card when chainPrompt is provided", () => {
    const chainPrompt = {
      type: "REBOUND",
      originalStat: { period: 1, clockTime: "5:00", timestamp: 123 },
    } as any;
    render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    expect(screen.getByText(/who got the REBOUND/i)).toBeInTheDocument();
  });

  it("calls onDismissChain when dismiss button is clicked in chain prompt", async () => {
    const user = userEvent.setup();
    const chainPrompt = {
      type: "ASSIST",
      originalStat: { period: 1, clockTime: "3:00", timestamp: 456 },
    } as any;
    render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    await user.click(screen.getByLabelText(/dismiss chain action/i));
    expect(defaultProps.onDismissChain).toHaveBeenCalledTimes(1);
  });

  it("does not render chain prompt when chainPrompt is null", () => {
    render(<LiveLineupCard {...defaultProps} chainPrompt={null} />);
    expect(screen.queryByText(/who got the/i)).not.toBeInTheDocument();
  });
});
