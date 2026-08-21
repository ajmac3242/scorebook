import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../../test-utils";
import { ScoreAdjustmentDialog } from "./ScoreAdjustmentDialog";

describe("ScoreAdjustmentDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    targetTeam: "TEAM" as const,
    teamName: "Eagles",
    currentScore: 42,
  };

  it("renders target team name and current score when open", () => {
    render(<ScoreAdjustmentDialog {...defaultProps} />);
    expect(
      screen.getByText("Score Override - Eagles"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("42").length).toBeGreaterThan(0);
  });

  it("returns null if targetTeam is null", () => {
    const { container } = render(
      <ScoreAdjustmentDialog {...defaultProps} targetTeam={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("disables save button when score delta is zero", () => {
    render(<ScoreAdjustmentDialog {...defaultProps} />);
    const saveButton = screen.getByRole("button", { name: "Save Adjustment" });
    expect(saveButton).toBeDisabled();
  });

  it("adjusts score via quick delta buttons and enables save", async () => {
    const user = userEvent.setup();
    render(<ScoreAdjustmentDialog {...defaultProps} />);

    const plusTwoButton = screen.getByRole("button", {
      name: "Adjust score by +2",
    });
    await user.click(plusTwoButton);

    expect(
      screen.getByText("Adjustment: +2 pts (SYSTEM_ADJUSTMENT)"),
    ).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Save Adjustment" });
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);
    expect(defaultProps.onSave).toHaveBeenCalledWith("TEAM", 2);
  });

  it("adjusts score via direct score input field", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ScoreAdjustmentDialog
        {...defaultProps}
        targetTeam="OPPONENT"
        teamName="Panthers"
        currentScore={30}
        onSave={onSave}
      />,
    );

    const input = screen.getByLabelText("Direct New Score");
    await user.clear(input);
    await user.type(input, "35");

    expect(
      screen.getByText("Adjustment: +5 pts (SYSTEM_ADJUSTMENT)"),
    ).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Save Adjustment" });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith("OPPONENT", 5);
  });

  it("handles negative score adjustments correctly", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ScoreAdjustmentDialog {...defaultProps} onSave={onSave} />);

    const minusOneButton = screen.getByRole("button", {
      name: "Adjust score by -1",
    });
    await user.click(minusOneButton);

    expect(
      screen.getByText("Adjustment: -1 pts (SYSTEM_ADJUSTMENT)"),
    ).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Save Adjustment" });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalledWith("TEAM", -1);
  });
});
