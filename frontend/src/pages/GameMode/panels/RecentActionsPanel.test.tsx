import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
  act,
  waitFor,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RecentActionsPanel } from "./RecentActionsPanel";
import { StatEvent } from "../../../db";

describe("RecentActionsPanel", () => {
  const mockStats: StatEvent[] = [
    {
      id: "s1",
      gameId: "g1",
      playerId: "p1",
      type: "2PT_MADE",
      points: 2,
      clockTime: 600,
      period: 1,
      timestamp: new Date().toISOString(),
    },
  ];

  const playerNamesMap = new Map([["p1", "LeBron James"]]);
  const jerseyMap = new Map([["p1", "23"]]);

  const defaultProps = {
    recentStats: mockStats,
    playerNamesMap,
    jerseyMap,
    isReadOnly: false,
    onDeleteRequest: vi.fn(),
    onRecordFirstAction: vi.fn(),
  };

  it("renders correctly with stats", async () => {
    render(<RecentActionsPanel {...defaultProps} />);
    expect(screen.getByText("Recent Actions")).toBeInTheDocument();
    expect(screen.getByText("2PT_MADE (2pt)")).toBeInTheDocument();
    expect(screen.getByText("LeBron James • 10:00")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    const user = userEvent.setup();
    render(<RecentActionsPanel {...defaultProps} recentStats={[]} />);
    expect(screen.getByText("Ready for Tip-off")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tap the court or click here to start recording actions.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Ready for Tip-off"));
    expect(defaultProps.onRecordFirstAction).toHaveBeenCalled();
  });

  it("handles delete request", async () => {
    const user = userEvent.setup();
    render(<RecentActionsPanel {...defaultProps} />);

    const deleteBtn = screen.getByLabelText(
      /Delete 2PT_MADE action for LeBron James/i,
    );
    await user.click(deleteBtn);
    expect(defaultProps.onDeleteRequest).toHaveBeenCalledWith("s1");
  });

  it("renders read-only mode", async () => {
    render(<RecentActionsPanel {...defaultProps} isReadOnly={true} />);
    expect(screen.queryByLabelText(/Delete/i)).not.toBeInTheDocument();
  });

  it("hides delete button for events in verified periods", async () => {
    render(
      <RecentActionsPanel
        {...defaultProps}
        verifiedPeriods={[1]}
      />,
    );
    expect(screen.queryByLabelText(/Delete/i)).not.toBeInTheDocument();
  });

  it("renders read-only empty state", async () => {
    const user = userEvent.setup();
    const onRecordFirstAction = vi.fn();
    render(
      <RecentActionsPanel
        {...defaultProps}
        recentStats={[]}
        isReadOnly={true}
        onRecordFirstAction={onRecordFirstAction}
      />,
    );
    expect(
      screen.getByText("No actions recorded for this game."),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Ready for Tip-off"));
    expect(onRecordFirstAction).not.toHaveBeenCalled();
  });

  it("handles unknown player", async () => {
    const unknownStats: StatEvent[] = [
      {
        id: "s2",
        gameId: "g1",
        playerId: "unknown",
        type: "FOUL",
        clockTime: 300,
        period: 2,
        timestamp: new Date().toISOString(),
      },
    ];
    render(<RecentActionsPanel {...defaultProps} recentStats={unknownStats} />);
    expect(screen.getByText("???")).toBeInTheDocument();
    expect(screen.getByText(/Unknown Player/i)).toBeInTheDocument();
    expect(screen.getByText(/5:00/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<RecentActionsPanel {...defaultProps} />);
      container = rendered.container;
    });

    await waitFor(() => {
      expect(screen.getByText("Recent Actions")).toBeInTheDocument();
    });

    await assertAccessible(container!);
  });
});
