import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  fireEvent,
} from "../test-utils";
import { ActionControls } from "../components/game/ActionControls";

describe("ActionControls", () => {
  const mockProps = {
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
    recentStatsLength: 1,
    onEndGame: vi.fn(),
    isGameCompleted: false,
  };

  it("renders all buttons when not read-only", () => {
    render(<ActionControls {...mockProps} />);

    expect(screen.getByText(/period/i)).toBeInTheDocument();
    expect(screen.getByText(/opp to/i)).toBeInTheDocument();
    expect(screen.getByText(/poss/i)).toBeInTheDocument();
    expect(screen.getByText(/sub/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/audit substitutions history/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/^FT$/i)).toBeInTheDocument();
    expect(screen.getByText(/undo/i)).toBeInTheDocument();
    expect(screen.getByText(/end game/i)).toBeInTheDocument();
  });

  it("disables buttons when read-only", () => {
    render(<ActionControls {...mockProps} isReadOnly={true} />);

    expect(screen.getByText(/period/i).closest("button")).toBeDisabled();
    expect(screen.getByText(/opp to/i).closest("button")).toBeDisabled();
    expect(screen.getByText(/poss/i).closest("button")).toBeDisabled();
    expect(screen.getByText(/sub/i).closest("button")).toBeDisabled();

    expect(screen.getByText(/timeout/i).closest("button")).toBeDisabled();
    expect(screen.getByText(/^FT$/i).closest("button")).toBeDisabled();
    expect(screen.getByText(/undo/i).closest("button")).toBeDisabled();
    // End game button is hidden when read-only
    expect(screen.queryByText(/end game/i)).not.toBeInTheDocument();
  });

  it("calls callbacks when buttons are clicked", () => {
    render(<ActionControls {...mockProps} />);

    fireEvent.click(screen.getByText(/period/i));
    expect(mockProps.onNextPeriod).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/opp to/i));
    expect(mockProps.onOpponentTurnover).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/sub/i));
    expect(mockProps.onQuickSub).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(/audit substitutions history/i));
    expect(mockProps.onAuditSubs).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/timeout/i));
    expect(mockProps.onTimeout).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/^FT$/i));
    expect(mockProps.onFtWorkflow).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/undo/i));
    expect(mockProps.onUndo).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/end game/i));
    expect(mockProps.onEndGame).toHaveBeenCalled();
  });

  it("shows correct possession toggle state", () => {
    const { rerender } = render(
      <ActionControls {...mockProps} possessionState="OUR_TEAM" />,
    );
    expect(
      screen.getByLabelText(/Change possession to Opponent/i),
    ).toBeInTheDocument();

    rerender(<ActionControls {...mockProps} possessionState="OPPONENT" />);
    expect(
      screen.getByLabelText(/Change possession to Our Team/i),
    ).toBeInTheDocument();
  });
});
