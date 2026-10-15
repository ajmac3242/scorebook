import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
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

  it("has no accessibility violations when open", async () => {
    const { container } = render(<ScoreAdjustmentDialog {...defaultProps} />);
    await assertAccessible(container);
  });

  it("renders target team name and current score when open", () => {
    render(<ScoreAdjustmentDialog {...defaultProps} />);
    expect(screen.getByText("Score Override - Eagles")).toBeInTheDocument();
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

  it("clamps negative score adjustments strictly to 0 and displays inline error message", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <ScoreAdjustmentDialog
        {...defaultProps}
        currentScore={2}
        onSave={onSave}
      />,
    );

    const minusThreeButton = screen.getByRole("button", {
      name: "Adjust score by -3",
    });
    await user.click(minusThreeButton);

    expect(screen.getByText("Score cannot be less than 0")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();

    // Verify setting negative value via direct change event also shows error
    const input = screen.getByLabelText("Direct New Score");
    // fireEvent intentional: userEvent.type has documented compatibility issues with typing negative numbers into HTML5 type="number" inputs in happy-dom
    fireEvent.change(input, { target: { value: "-5" } });

    expect(screen.getByText("Score cannot be less than 0")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0")).toBeInTheDocument();
  });
});
