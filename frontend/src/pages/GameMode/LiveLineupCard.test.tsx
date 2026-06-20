import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import { LiveLineupCard } from "./LiveLineupCard";

const mockPlayer = (id: string, name: string) => ({ id, name }) as any;

const defaultProps = {
  players: [mockPlayer("p1", "LeBron James"), mockPlayer("p2", "Anthony Davis")],
  onCourtIds: new Set(["p1"]),
  game: { foulLimit: 5 } as any,
  team: { defaultFoulLimit: 5 } as any,
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
     * This snapshot protects the active lineup's layout, stint duration display,
     * plus/minus visibility, and the structure of player buttons within the card.
     */
    const { asFragment } = render(<LiveLineupCard {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot("LiveLineupCard - active lineup");
  });

  it("matches snapshot with chain prompt", () => {
    const chainPrompt = {
      type: "REBOUND" as const,
      originalStat: { period: 1, clockTime: "5:00", timestamp: 123 },
    } as any;
    const { asFragment } = render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    expect(asFragment()).toMatchSnapshot("LiveLineupCard - with chain prompt");
  });

  it("renders Live Lineup header text", () => {
    render(<LiveLineupCard {...defaultProps} />);
    expect(screen.getByText(/live lineup/i)).toBeInTheDocument();
  });

  it("calls onPlayerClick when player button is clicked", async () => {
    const user = userEvent.setup();
    render(<LiveLineupCard {...defaultProps} />);
    // LineupPlayerButton renders player name
    await user.click(screen.getByText("LeBron James"));
    expect(defaultProps.onPlayerClick).toHaveBeenCalledWith("p1");
  });

  it("renders chain prompt card when chainPrompt is provided", () => {
    const chainPrompt = {
      type: "REBOUND" as const,
      originalStat: { period: 1, clockTime: "5:00", timestamp: 123 },
    } as any;
    render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    expect(screen.getByText(/who got the rebound/i)).toBeInTheDocument();
  });

  it("calls onDismissChain when dismiss button is clicked in chain prompt", async () => {
    const user = userEvent.setup();
    const chainPrompt = {
      type: "ASSIST" as const,
      originalStat: { period: 1, clockTime: "3:00", timestamp: 456 },
    } as any;
    render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    await user.click(screen.getByLabelText(/dismiss/i));
    expect(defaultProps.onDismissChain).toHaveBeenCalledTimes(1);
  });

  it("does not render chain prompt when chainPrompt is null", () => {
    render(<LiveLineupCard {...defaultProps} chainPrompt={null} />);
    expect(screen.queryByText(/who got the/i)).not.toBeInTheDocument();
  });
});
