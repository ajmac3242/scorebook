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
});
