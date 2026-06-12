import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  fireEvent,
  waitFor,
} from "../../../test-utils";
import FreeThrowWorkflowDialog from "./FreeThrowWorkflowDialog";
import React from "react";
import { mockDb } from "../../../dbMock";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  gameId: "g1",
  playerId: "p1",
  player: { id: "p1", name: "John Doe", avatarColor: "red" },
  jerseyNumber: "10",
  period: 1,
  clockTime: 600,
};

describe("FreeThrowWorkflowDialog", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("renders correctly when open", () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    expect(screen.getByText("Free Throw Sequence")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("allows changing the number of attempts", () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    // Default is 2
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(2);

    fireEvent.click(screen.getByText("3 Shots"));
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(3);

    fireEvent.click(screen.getByText("1 Shot"));
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(1);
  });

  it("allows recording makes and misses", () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    const makeButtons = screen.getAllByRole("button", { name: /Make/i });
    const missButtons = screen.getAllByRole("button", { name: /Miss/i });

    fireEvent.click(makeButtons[0]);
    fireEvent.click(missButtons[1]);

    // Check if they are "contained" (active)
    expect(makeButtons[0]).toHaveClass("MuiButton-contained");
    expect(makeButtons[0]).toHaveClass("MuiButton-colorSuccess");
    expect(missButtons[1]).toHaveClass("MuiButton-contained");
    expect(missButtons[1]).toHaveClass("MuiButton-colorError");
  });

  it("disables Save button until all attempts are recorded", () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /Save Sequence/i });
    expect(saveButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    expect(saveButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Miss/i })[1]);
    expect(saveButton).toBeEnabled();
  });

  it("saves stats and closes on Save", async () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    fireEvent.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Miss/i })[1]);

    fireEvent.click(screen.getByRole("button", { name: /Save Sequence/i }));

    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledTimes(2);
    });

    expect(mockDb.stats.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MAKE",
        points: 1,
      }),
    );
    expect(mockDb.stats.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "MISS",
        points: 0,
      }),
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles save error gracefully", async () => {
    const logger = await import("../../../utils/logger");
    const loggerSpy = vi
      .spyOn(logger.logger, "error")
      .mockImplementation(() => {});

    vi.spyOn(mockDb.stats, "add").mockImplementation(() => {
      throw new Error("Save failed");
    });

    render(
      <CourtSightThemeProvider presets={PRESETS} defaultPresetId="classic">
        <FreeThrowWorkflowDialog {...defaultProps} />
      </CourtSightThemeProvider>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Miss/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /Save Sequence/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to record free throw sequence"),
        expect.any(Error),
      );
    });
  });
});
