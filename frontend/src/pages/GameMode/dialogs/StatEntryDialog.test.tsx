import React from "react";
import { describe, it, vi } from "vitest";
import {
  renderWithProviders as render,
  assertAccessible,
} from "../../../test-utils";
import { StatEntryDialog } from "./StatEntryDialog";
import { ACTION_TYPES } from "../../../constants/stats";

describe("StatEntryDialog Accessibility", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    isEditing: false,
    isSavingStat: false,
    trackingMode: "TEAM" as const,
    selectedPlayerId: "p1",
    setSelectedPlayerId: vi.fn(),
    players: [{ id: "p1", name: "John Doe" }],
    jerseyMap: new Map([["p1", "10"]]),
    draftOnCourtIds: new Set(["p1"]),
    playerNamesMap: new Map([["p1", "John Doe"]]),
    game: {
      id: "g1",
      teamId: "t1",
      opponent: "Opponent",
      date: "2024-01-01",
      location: "Home",
    },
    team: {
      id: "t1",
      name: "Our Team",
      periodType: "QUARTERS" as const,
      playbook: ["P&R", "Motion"],
    },
    statType: ACTION_TYPES.MAKE,
    setStatType: vi.fn(),
    points: 2,
    setPoints: vi.fn(),
    playName: "",
    setPlayName: vi.fn(),
    shotQuality: null,
    setShotQuality: vi.fn(),
    situation: null,
    setSituation: vi.fn(),
    opponentPlayType: null,
    setOpponentPlayType: vi.fn(),
    periodLabel: "Quarter",
    period: 1,
    clockSeconds: 600,
    oppFouls: 0,
    periodType: "QUARTERS",
  };

  it("should have no accessibility violations in TEAM mode", async () => {
    const { baseElement } = render(<StatEntryDialog {...defaultProps} />);
    // Dialog renders in a portal, so we use baseElement
    await assertAccessible(baseElement as HTMLElement);
  });

  it("should have no accessibility violations in OPPONENT mode", async () => {
    const { baseElement } = render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        selectedPlayerId="OPPONENT:10"
      />,
    );
    await assertAccessible(baseElement as HTMLElement);
  });
});
