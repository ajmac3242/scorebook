import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { ActionControls } from "./ActionControls";

describe("ActionControls", () => {
  const defaultProps = {
    isReadOnly: false,
    onUndo: vi.fn(),
    onQuickSub: vi.fn(),
    onFtWorkflow: vi.fn(),
    onAuditSubs: vi.fn(),
    onTimeout: vi.fn(),
    onNextPeriod: vi.fn(),
    onTogglePossession: vi.fn(),
    onOpponentTurnover: vi.fn(),
    possessionState: null,
    recentStatsLength: 5,
    onEndGame: vi.fn(),
    isGameCompleted: false,
    onFlipPossessionArrow: vi.fn(),
  };

  it("calls callbacks when buttons are clicked", async () => {
    const user = userEvent.setup();
    render(<ActionControls {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /undo last action/i }));
    expect(defaultProps.onUndo).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /change possession to our team/i }));
    expect(defaultProps.onTogglePossession).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /end and save game/i }));
    expect(defaultProps.onEndGame).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /flip possession arrow/i }));
    expect(defaultProps.onFlipPossessionArrow).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /advance to next period/i }));
    expect(defaultProps.onNextPeriod).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /record opponent turnover/i }));
    expect(defaultProps.onOpponentTurnover).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /manage lineup substitutions/i }));
    expect(defaultProps.onQuickSub).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /audit substitutions history/i }));
    expect(defaultProps.onAuditSubs).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /log team timeout/i }));
    expect(defaultProps.onTimeout).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /record free throws/i }));
    expect(defaultProps.onFtWorkflow).toHaveBeenCalled();
  });

  it("disables most buttons when isReadOnly is true", () => {
    render(<ActionControls {...defaultProps} isReadOnly={true} />);

    expect(screen.getByRole("button", { name: /advance to next period/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /record opponent turnover/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /change possession to our team/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /manage lineup substitutions/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /flip possession arrow/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /audit substitutions history/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /log team timeout/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /record free throws/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /undo last action/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /end and save game/i })).not.toBeInTheDocument();
  });

  it("shows correct possession label based on state", () => {
    const { rerender } = render(<ActionControls {...defaultProps} possessionState="OUR_TEAM" />);
    expect(screen.getByRole("button", { name: /change possession to opponent/i })).toBeInTheDocument();

    rerender(<ActionControls {...defaultProps} possessionState={null} />);
    expect(screen.getByRole("button", { name: /change possession to our team/i })).toBeInTheDocument();
  });
});
