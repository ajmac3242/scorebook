import { renderWithProviders as render, screen } from "../../../test-utils";
import { VerifiedPeriodModal } from "./VerifiedPeriodModal";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

describe("VerifiedPeriodModal", () => {
  const mockOnVerify = vi.fn();
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    period: 1,
    periodLabel: "Quarter",
    appScore: { team: 20, opp: 18 },
    appFouls: { team: 3, opp: 4 },
    teamPeriodPlayerFouls: new Map([["p1", 2]]),
    players: [{ id: "p1", name: "Player 1" }],
    jerseyMap: new Map([["p1", "10"]]),
    onVerify: mockOnVerify,
  };

  beforeEach(() => {
    mockOnVerify.mockClear();
  });

  it("renders correctly with app totals", () => {
    render(<VerifiedPeriodModal {...defaultProps} />);
    expect(screen.getByText("Verify Quarter 1 Totals")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<VerifiedPeriodModal {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("allows editing values and calls onVerify with new totals", async () => {
    const user = userEvent.setup();
    render(<VerifiedPeriodModal {...defaultProps} />);

    const teamScoreInput = screen.getAllByLabelText("Official Score")[0];
    const oppFoulsInput = screen.getAllByLabelText("Official Fouls")[1];

    await user.clear(teamScoreInput);
    await user.type(teamScoreInput, "22");

    await user.clear(oppFoulsInput);
    await user.type(oppFoulsInput, "5");

    await user.click(screen.getByText("Verify & Continue"));

    expect(mockOnVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        teamScore: 22,
        oppScore: 18,
        teamFouls: 3,
        oppFouls: 5,
        playerFoulAdjustments: {},
      }),
    );
  });

  it("handles empty or invalid inputs by defaulting to 0", async () => {
    const user = userEvent.setup();
    render(<VerifiedPeriodModal {...defaultProps} />);

    const inputs = screen.getAllByRole("spinbutton");
    for (const input of inputs) {
      await user.clear(input);
    }

    await user.click(screen.getByText("Verify & Continue"));

    expect(mockOnVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        teamScore: 0,
        oppScore: 0,
        teamFouls: 0,
        oppFouls: 0,
        playerFoulAdjustments: {},
      }),
    );
  });

  it("allows adjusting individual player fouls", async () => {
    const user = userEvent.setup();
    render(<VerifiedPeriodModal {...defaultProps} />);

    expect(screen.getByText("#10 Player 1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const addBtn = screen.getByTestId("AddIcon").parentElement!;
    await user.click(addBtn);

    expect(screen.getByText("3")).toBeInTheDocument();

    // Check Team Official Fouls input specifically
    const teamFoulsInput = screen.getAllByLabelText("Official Fouls")[0];
    expect(teamFoulsInput).toHaveValue(4);

    await user.click(screen.getByText("Verify & Continue"));

    expect(mockOnVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        teamFouls: 4,
        playerFoulAdjustments: { p1: 1 },
      }),
    );
  });

  it("allows adjusting opponent player fouls", async () => {
    const user = userEvent.setup();
    const oppPeriodPlayerFouls = new Map([["23", 2]]);
    render(
      <VerifiedPeriodModal
        {...defaultProps}
        oppPeriodPlayerFouls={oppPeriodPlayerFouls}
      />,
    );

    expect(screen.getByText("#23 Opponent")).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2); // One for our player, one for opponent player

    // The first AddIcon is for our player, the second is for opponent
    const addBtns = screen.getAllByTestId("AddIcon");
    await user.click(addBtns[1].parentElement!);

    // Now there should be one element with "3" (opponent count increased from 2 to 3)
    expect(screen.getByText("3")).toBeInTheDocument();

    // Check Opponent Official Fouls input specifically (second Official Fouls input)
    const oppFoulsInput = screen.getAllByLabelText("Official Fouls")[1];
    expect(oppFoulsInput).toHaveValue(5); // original 4 + 1 adjustment

    // Test decreasing fouls
    const removeBtns = screen.getAllByTestId("RemoveIcon");
    await user.click(removeBtns[1].parentElement!); // Opponent player decrease

    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(oppFoulsInput).toHaveValue(4);

    await user.click(screen.getByText("Verify & Continue"));

    expect(mockOnVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        oppFouls: 4,
        oppPlayerFoulAdjustments: {}, // Adjusted up and down, net change 0
      }),
    );
  });

  it("handles buzzer beater removal and restoration", async () => {
    const user = userEvent.setup();
    const buzzerBeaters = [
      { id: "bb1", playerId: "p1", points: 2 },
      { id: "bb2", playerId: "OPPONENT:23", points: 3 },
    ];
    render(
      <VerifiedPeriodModal {...defaultProps} buzzerBeaters={buzzerBeaters} />,
    );

    expect(screen.getByText("2pts by #10")).toBeInTheDocument();
    expect(screen.getByText("3pts by #23")).toBeInTheDocument();

    const removeBtns = screen.getAllByLabelText(/Remove buzzer beater/);

    // Remove team buzzer beater
    await user.click(removeBtns[0]);
    expect(screen.getAllByLabelText("Official Score")[0]).toHaveValue(18); // 20 - 2

    // Remove opponent buzzer beater
    await user.click(removeBtns[1]);
    expect(screen.getAllByLabelText("Official Score")[1]).toHaveValue(15); // 18 - 3

    // Restore team buzzer beater
    const restoreBtn = screen.getByLabelText("Restore buzzer beater by #10");
    await user.click(restoreBtn);
    expect(screen.getAllByLabelText("Official Score")[0]).toHaveValue(20);

    await user.click(screen.getByText("Verify & Continue"));

    expect(mockOnVerify).toHaveBeenCalledWith(
      expect.objectContaining({
        teamScore: 20,
        oppScore: 15,
        removedBuzzerBeaterIds: ["bb2"],
      }),
    );
  });

  it("sorts players by jersey number", () => {
    const players = [
      { id: "p1", name: "Player A" },
      { id: "p2", name: "Player B" },
    ];
    const jerseyMap = new Map([
      ["p1", "20"],
      ["p2", "5"],
    ]);

    render(
      <VerifiedPeriodModal
        {...defaultProps}
        players={players}
        jerseyMap={jerseyMap}
      />,
    );

    const playerRows = screen.getAllByText(/Player [AB]/);
    expect(playerRows[0]).toHaveTextContent("#5 Player B");
    expect(playerRows[1]).toHaveTextContent("#20 Player A");
  });

  it("displays empty state when no players are provided", () => {
    render(<VerifiedPeriodModal {...defaultProps} players={[]} />);
    expect(screen.getByText("No players available")).toBeInTheDocument();
  });

  it("renders unlock button when period is verified and calls onUnlock on click", async () => {
    const user = userEvent.setup();
    const handleUnlock = vi.fn();
    render(
      <VerifiedPeriodModal
        {...defaultProps}
        isVerified={true}
        onUnlock={handleUnlock}
      />,
    );

    const unlockBtn = screen.getByRole("button", {
      name: "Unlock Period 1 Stats",
    });
    expect(unlockBtn).toBeInTheDocument();

    await user.click(unlockBtn);
    expect(handleUnlock).toHaveBeenCalledWith(1);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
