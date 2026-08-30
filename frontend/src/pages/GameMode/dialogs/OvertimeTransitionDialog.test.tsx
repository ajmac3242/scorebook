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

  it("has no accessibility violations", async () => {
    const { container } = render(
      <OvertimeTransitionDialog {...defaultProps} />,
    );
    await assertAccessible(container);
  });
});
