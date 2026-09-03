import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import { OvertimeTransitionDialog } from "./OvertimeTransitionDialog";

describe("OvertimeTransitionDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    period: 4,
    periodLabel: "Quarter",
    currentScore: { team: 65, opp: 65 },
    teamName: "Wildcats",
    opponentName: "Cougars",
    defaultOvertimeLength: 5,
  };

  it("renders tie game details and default duration input when open", () => {
    render(<OvertimeTransitionDialog {...defaultProps} />);

    expect(screen.getByText("Regulation Tied — Overtime")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quarter 4 ended in a tie. Configure the duration for the upcoming Overtime period.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Wildcats")).toBeInTheDocument();
    expect(screen.getByText("Cougars")).toBeInTheDocument();
    expect(screen.getAllByText("65")).toHaveLength(2);

    const input = screen.getByLabelText("Overtime duration in minutes");
    expect(input).toHaveValue(5);
  });

  it("calls onConfirm with configured duration when Start Overtime is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <OvertimeTransitionDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    const input = screen.getByLabelText("Overtime duration in minutes");
    await user.clear(input);
    await user.type(input, "4");

    const confirmButton = screen.getByRole("button", {
      name: "Start Overtime",
    });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(4);
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OvertimeTransitionDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("selects preset durations when preset buttons are clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <OvertimeTransitionDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    const preset3Btn = screen.getByRole("button", {
      name: "Set overtime duration to 3 minutes",
    });
    const preset10Btn = screen.getByRole("button", {
      name: "Set overtime duration to 10 minutes",
    });

    await user.click(preset3Btn);
    const input = screen.getByLabelText("Overtime duration in minutes");
    expect(input).toHaveValue(3);

    await user.click(preset10Btn);
    expect(input).toHaveValue(10);

    const confirmButton = screen.getByRole("button", {
      name: "Start Overtime",
    });
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith(10);
  });

  it("clamps custom duration input to range [1, 20] and handles empty inputs", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <OvertimeTransitionDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    const input = screen.getByLabelText("Overtime duration in minutes");
    const confirmButton = screen.getByRole("button", {
      name: "Start Overtime",
    });

    // Case 1: 25 minutes should be clamped to maximum 20
    await user.clear(input);
    await user.type(input, "25");
    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenLastCalledWith(20);

    // Case 2: Empty input or 0 (falsy) should default to 5
    await user.clear(input);
    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenLastCalledWith(5);

    // Case 3: 2 minutes should confirm as 2
    await user.type(input, "2");
    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenLastCalledWith(2);
  });

  it("uses default overtime length 5 when defaultOvertimeLength prop is omitted", () => {
    const { defaultOvertimeLength, ...propsWithoutDefault } = defaultProps;
    render(<OvertimeTransitionDialog {...propsWithoutDefault} />);

    const input = screen.getByLabelText("Overtime duration in minutes");
    expect(input).toHaveValue(5);
  });

  it("handles onClose reason filtering appropriately", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OvertimeTransitionDialog {...defaultProps} onClose={onClose} />);

    // Press Escape key
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <OvertimeTransitionDialog {...defaultProps} />,
    );
    await assertAccessible(container);
  });
});
