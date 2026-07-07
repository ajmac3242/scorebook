import { renderWithProviders as render, screen } from "../../../test-utils";
import { DefensiveIntegrityDialog } from "./DefensiveIntegrityDialog";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";

describe("DefensiveIntegrityDialog", () => {
  const mockIntegrity = [
    {
      reason: "Missed Rotation",
      frequency: 5,
      points: 12,
      percentage: "40.0",
    },
    {
      reason: "Poor Closeout",
      frequency: 2,
      points: 4,
      percentage: "13.3",
    },
  ];

  it("renders correctly when open", () => {
    render(
      <DefensiveIntegrityDialog
        open={true}
        onClose={vi.fn()}
        defensiveIntegrity={mockIntegrity}
      />,
    );

    expect(screen.getByText("Defensive Integrity Report")).toBeInTheDocument();
    expect(screen.getByText("Missed Rotation")).toBeInTheDocument();
    expect(screen.getByText("40.0%")).toBeInTheDocument();
    expect(screen.getByText("Poor Closeout")).toBeInTheDocument();
  });

  it("calls onClose when Close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DefensiveIntegrityDialog
        open={true}
        onClose={onClose}
        defensiveIntegrity={mockIntegrity}
      />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("highlights high percentage rows in error color", () => {
    render(
      <DefensiveIntegrityDialog
        open={true}
        onClose={vi.fn()}
        defensiveIntegrity={mockIntegrity}
      />,
    );

    const highFreqCell = screen.getByText("40.0%");
    // We expect the text to be colored because percentage is > 30
    // RTL's toHaveStyle can be tricky with CSS variables, but it should resolve to the hex in happy-dom if the theme is loaded.
    // Given the failure before, let's check for the computed hex if possible, or just skip strict color check if brittle.
    // The previous failure showed it received #A64444 which is errorScale[500].
    expect(highFreqCell).toHaveStyle({ color: "#A64444" });

    const lowFreqCell = screen.getByText("13.3%");
    expect(lowFreqCell).not.toHaveStyle({ color: "#A64444" });
  });
});
