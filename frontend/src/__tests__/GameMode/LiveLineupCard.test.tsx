import { vi } from "vitest";
import React from "react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
} from "../../test-utils";
import { LiveLineupCard } from "../../pages/GameMode/LiveLineupCard";

vi.mock("../../pages/GameMode/GameModeComponents", () => ({
  LineupPlayerButton: ({ player, onClick }: any) => (
    <button
      onClick={() => onClick(player.id)}
      data-testid={`player-btn-${player.id}`}
    >
      Player {player.id}
    </button>
  ),
}));

vi.mock("../../components/SharedUI", () => ({
  SurfaceCard: ({ children }: any) => <div>{children}</div>,
}));

const mockPlayer = (id: string) => ({ id, name: `Player ${id}` }) as any;

const defaultProps = {
  players: [mockPlayer("p1"), mockPlayer("p2")],
  onCourtIds: new Set(["p1"]),
  game: null,
  team: null,
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

  it("renders Live Lineup header text", () => {
    render(<LiveLineupCard {...defaultProps} />);
    expect(screen.getByText(/live lineup/i)).toBeInTheDocument();
  });

  it("renders player button for on-court player", () => {
    render(<LiveLineupCard {...defaultProps} />);
    expect(screen.getByTestId("player-btn-p1")).toBeInTheDocument();
  });

  it("calls onPlayerClick when player button is clicked", async () => {
    const user = userEvent.setup();
    render(<LiveLineupCard {...defaultProps} />);
    await user.click(screen.getByTestId("player-btn-p1"));
    expect(defaultProps.onPlayerClick).toHaveBeenCalledWith("p1");
  });

  it("renders chain prompt card when chainPrompt is provided", () => {
    const chainPrompt = {
      type: "REBOUND",
      originalStat: { period: 1, clockTime: "5:00", timestamp: 123 },
    } as any;
    render(<LiveLineupCard {...defaultProps} chainPrompt={chainPrompt} />);
    expect(screen.getByText(/who got the rebound/i)).toBeInTheDocument();
  });

  it("calls onDismissChain when dismiss button is clicked in chain prompt", async () => {
    const user = userEvent.setup();
    const chainPrompt = {
      type: "ASSIST",
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
