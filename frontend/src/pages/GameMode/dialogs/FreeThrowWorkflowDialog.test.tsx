import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  waitFor,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import FreeThrowWorkflowDialog from "./FreeThrowWorkflowDialog";
import React from "react";
import { mockDb } from "../../../dbMock";

vi.mock("../../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

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
    vi.restoreAllMocks();
  });

  it("renders correctly when open", () => {
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    expect(screen.getByText("Free Throw Sequence")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("allows changing the number of attempts", async () => {
    const user = userEvent.setup();
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    // Default is 2
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(2);

    await user.click(screen.getByText("3 Shots"));
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(3);

    await user.click(screen.getByText("1 Shot"));
    expect(screen.getAllByText(/Attempt #/)).toHaveLength(1);
  });

  it("allows recording makes and misses", async () => {
    const user = userEvent.setup();
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    const makeButtons = screen.getAllByRole("button", { name: /Make/i });
    const missButtons = screen.getAllByRole("button", { name: /Miss/i });

    await user.click(makeButtons[0]);
    await user.click(missButtons[1]);

    // Check if they are "contained" (active)
    expect(makeButtons[0]).toHaveClass("MuiButton-contained");
    expect(makeButtons[0]).toHaveClass("MuiButton-colorSuccess");
    expect(missButtons[1]).toHaveClass("MuiButton-contained");
    expect(missButtons[1]).toHaveClass("MuiButton-colorError");
  });

  it("disables Save button until all attempts are recorded", async () => {
    const user = userEvent.setup();
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    const saveButton = screen.getByRole("button", { name: /Save Sequence/i });
    expect(saveButton).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    expect(saveButton).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: /Miss/i })[1]);
    expect(saveButton).toBeEnabled();
  });

  it("persists stats incrementally in real time on each attempt and closes on Save", async () => {
    const user = userEvent.setup();
    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    // Shot 1 MAKE -> persists immediately
    await user.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "MAKE",
          points: 1,
        }),
      );
    });

    // Shot 2 MISS -> persists immediately
    await user.click(screen.getAllByRole("button", { name: /Miss/i })[1]);
    await waitFor(() => {
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "MISS",
          points: 0,
        }),
      );
    });

    await user.click(screen.getByRole("button", { name: /Save Sequence/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles save error gracefully", async () => {
    const user = userEvent.setup();
    const logger = await import("../../../utils/logger");
    const loggerSpy = vi
      .spyOn(logger.logger, "error")
      .mockImplementation(() => {});

    const spyAdd = vi.spyOn(mockDb.stats, "add").mockImplementation(() => {
      throw new Error("Save failed");
    });

    render(<FreeThrowWorkflowDialog {...defaultProps} />);

    await user.click(screen.getAllByRole("button", { name: /Make/i })[0]);
    await user.click(screen.getAllByRole("button", { name: /Miss/i })[1]);
    await user.click(screen.getByRole("button", { name: /Save Sequence/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to record free throw sequence"),
        expect.any(Error),
      );
    });

    spyAdd.mockRestore();
  });

  describe("1-and-1 Bonus Ruleset", () => {
    it("terminates sequence immediately on 1st shot MISS", async () => {
      const user = userEvent.setup();
      render(
        <FreeThrowWorkflowDialog {...defaultProps} initialAttempts="1-and-1" />,
      );

      // Initially, only Attempt #1 is visible
      expect(screen.getAllByText(/Attempt #/)).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: /Save Sequence/i }),
      ).toBeDisabled();

      // Click MISS on Attempt #1
      await user.click(screen.getByRole("button", { name: /Miss/i }));

      // Attempt #2 should remain hidden (skipped)
      expect(screen.getAllByText(/Attempt #/)).toHaveLength(1);

      const enabledSaveBtn = await screen.findByRole("button", {
        name: /Save Sequence/i,
      });
      expect(enabledSaveBtn).toBeEnabled();

      await user.click(enabledSaveBtn);

      await waitFor(() => {
        expect(mockDb.stats.add).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
      expect(mockDb.stats.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "MISS",
          points: 0,
        }),
      );
    });

    it("proceeds to Attempt #2 on 1st shot MAKE", async () => {
      const user = userEvent.setup();
      render(
        <FreeThrowWorkflowDialog {...defaultProps} initialAttempts="1-and-1" />,
      );

      expect(
        screen.getByRole("button", { name: /Save Sequence/i }),
      ).toBeDisabled();

      // Click MAKE on Attempt #1
      await user.click(screen.getByRole("button", { name: /Make/i }));

      // Attempt #2 should now be visible
      await waitFor(() => {
        expect(screen.getAllByText(/Attempt #/)).toHaveLength(2);
      });
      expect(
        screen.getByRole("button", { name: /Save Sequence/i }),
      ).toBeDisabled();

      // Click MAKE on Attempt #2
      const makeButtons = screen.getAllByRole("button", { name: /Make/i });
      await user.click(makeButtons[1]);

      // Wait for Attempt #2 Make button to receive active contained style
      await waitFor(() => {
        const currentMakes = screen.getAllByRole("button", { name: /Make/i });
        expect(currentMakes[1]).toHaveClass("MuiButton-contained");
      });

      const enabledSaveBtn = await screen.findByRole("button", {
        name: /Save Sequence/i,
      });
      expect(enabledSaveBtn).toBeEnabled();
      await user.click(enabledSaveBtn);

      await waitFor(() => {
        expect(mockDb.stats.add).toHaveBeenCalledTimes(2);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe("Disqualified Shooter Interlock", () => {
    it("displays warning banner and disables save when assigned shooter is disqualified", () => {
      const statsMap = new Map([
        ["p1", { fouls: 5, points: 10, FGA: 5, FGM: 2, "3PA": 1, "3PM": 0, FTA: 0, FTM: 0, rebounds: 2, assists: 1, steals: 0, blocks: 0, turnovers: 1, plusMinus: 2, trueShootingPercentage: 0.5, effectiveFieldGoalPercentage: 0.4, offensiveRebounds: 0, defensiveRebounds: 2, stealsBlocksCombo: 0, assistTurnoverRatio: 1, usageRate: 0.2 } as any],
      ]);

      render(
        <FreeThrowWorkflowDialog
          {...defaultProps}
          foulLimit={5}
          statsMap={statsMap}
        />,
      );

      expect(
        screen.getByTestId("disqualified-shooter-warning-banner"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Assigned shooter is disqualified/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save Sequence/i })).toBeDisabled();
    });

    it("allows selecting an eligible substitute shooter and enables save after selection", async () => {
      const user = userEvent.setup();
      const mockPlayerSelect = vi.fn();
      const statsMap = new Map([
        ["p1", { fouls: 5, points: 10, FGA: 5, FGM: 2, "3PA": 1, "3PM": 0, FTA: 0, FTM: 0, rebounds: 2, assists: 1, steals: 0, blocks: 0, turnovers: 1, plusMinus: 2, trueShootingPercentage: 0.5, effectiveFieldGoalPercentage: 0.4, offensiveRebounds: 0, defensiveRebounds: 2, stealsBlocksCombo: 0, assistTurnoverRatio: 1, usageRate: 0.2 } as any],
        ["p2", { fouls: 2, points: 4, FGA: 2, FGM: 1, "3PA": 0, "3PM": 0, FTA: 0, FTM: 0, rebounds: 1, assists: 0, steals: 0, blocks: 0, turnovers: 0, plusMinus: 0, trueShootingPercentage: 0.5, effectiveFieldGoalPercentage: 0.5, offensiveRebounds: 0, defensiveRebounds: 1, stealsBlocksCombo: 0, assistTurnoverRatio: 0, usageRate: 0.1 } as any],
      ]);
      const onCourtPlayers = [
        { id: "p1", name: "John Doe" },
        { id: "p2", name: "Jane Smith" },
      ];
      const jerseyMap = new Map([
        ["p1", "10"],
        ["p2", "24"],
      ]);

      render(
        <FreeThrowWorkflowDialog
          {...defaultProps}
          foulLimit={5}
          statsMap={statsMap}
          onCourtPlayers={onCourtPlayers}
          jerseyMap={jerseyMap}
          onPlayerSelect={mockPlayerSelect}
        />,
      );

      // p1 is disqualified, button for #10 is disabled
      const disqButton = screen.getByRole("button", {
        name: /Select shooter #10 John Doe/i,
      });
      expect(disqButton).toBeDisabled();

      // p2 is eligible
      const eligibleButton = screen.getByRole("button", {
        name: /Select shooter #24 Jane Smith/i,
      });
      expect(eligibleButton).not.toBeDisabled();

      await user.click(eligibleButton);
      expect(mockPlayerSelect).toHaveBeenCalledWith("p2");
    });
  });
});
