import React from "react";
import { describe, it, vi, expect } from "vitest";
import {
  renderWithProviders as render,
  assertAccessible,
} from "../../../test-utils";
import { StatEntryDialog } from "./StatEntryDialog";
import { ACTION_TYPES, SHOT_QUALITY, SITUATIONS } from "../../../constants/stats";
import userEvent from "@testing-library/user-event";

describe("StatEntryDialog", () => {
  const createDefaultProps = () => ({
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
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations in TEAM mode", async () => {
      const { baseElement } = render(<StatEntryDialog {...createDefaultProps()} />);
      await assertAccessible(baseElement as HTMLElement);
    });

    it("should have no accessibility violations in OPPONENT mode", async () => {
      const { baseElement } = render(
        <StatEntryDialog
          {...createDefaultProps()}
          trackingMode="OPPONENT"
          selectedPlayerId="OPPONENT:10"
        />,
      );
      await assertAccessible(baseElement as HTMLElement);
    });
  });

  describe("Functional", () => {
    it("should call setStatType when an action button is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} statType={null} />);

      await user.click(getByText("Miss (X)"));
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.MISS);
    });

    it("should call setSelectedPlayerId when a player button is clicked in TEAM mode", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} selectedPlayerId={null} />);

      await user.click(getByText("10"));
      expect(props.setSelectedPlayerId).toHaveBeenCalledWith("p1");
    });

    it("should call setPlayName when a playbook chip is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} />);

      await user.click(getByText("P&R"));
      expect(props.setPlayName).toHaveBeenCalledWith("P&R");
    });

    it("should call setShotQuality when a quality chip is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} />);

      await user.click(getByText(SHOT_QUALITY.OPEN));
      expect(props.setShotQuality).toHaveBeenCalledWith(SHOT_QUALITY.OPEN);
    });

    it("should call setSituation when a situation chip is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} />);

      await user.click(getByText(SITUATIONS.ATO));
      expect(props.setSituation).toHaveBeenCalledWith(SITUATIONS.ATO);
    });

    it("should call setPoints when a points button is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByLabelText } = render(<StatEntryDialog {...props} />);

      await user.click(getByLabelText("3 point shot"));
      expect(props.setPoints).toHaveBeenCalledWith(3);
    });

    it("should call onSave when Save button is clicked", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(<StatEntryDialog {...props} />);

      await user.click(getByText("Save"));
      expect(props.onSave).toHaveBeenCalled();
    });

    it("should call setOpponentPlayType when a toggle button is clicked in OPPONENT mode", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      const { getByText } = render(
        <StatEntryDialog
          {...props}
          trackingMode="OPPONENT"
          selectedPlayerId="OPPONENT:10"
        />,
      );

      await user.click(getByText("ISO"));
      expect(props.setOpponentPlayType).toHaveBeenCalledWith("ISO");
    });

    it("should disable save button if no player is selected", () => {
      const { getByRole } = render(<StatEntryDialog {...createDefaultProps()} selectedPlayerId={null} />);
      expect(getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("should disable save button if no stat type is selected", () => {
      const { getByRole } = render(<StatEntryDialog {...createDefaultProps()} statType={null} />);
      expect(getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("should call onSave when Enter key is pressed and valid", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      render(<StatEntryDialog {...props} />);

      await user.keyboard("{Enter}");
      expect(props.onSave).toHaveBeenCalled();
    });

    it("should call setStatType when shortcut keys are pressed", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      render(<StatEntryDialog {...props} />);

      await user.keyboard("m");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.MAKE);

      await user.keyboard("x");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.MISS);

      await user.keyboard("o");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.OFF_REBOUND);

      await user.keyboard("d");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.DEF_REBOUND);

      await user.keyboard("a");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.ASSIST);

      await user.keyboard("t");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.TURNOVER);

      await user.keyboard("s");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.STEAL);

      await user.keyboard("b");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.BLOCK);

      await user.keyboard("f");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.FOUL_SHOOTING);

      await user.keyboard("p");
      expect(props.setStatType).toHaveBeenCalledWith(ACTION_TYPES.PAINT_TOUCH);
    });

    it("should do nothing on keydown if isSavingStat is true", async () => {
      const props = createDefaultProps();
      const user = userEvent.setup();
      render(<StatEntryDialog {...props} isSavingStat={true} />);

      await user.keyboard("m");
      expect(props.setStatType).not.toHaveBeenCalled();
    });
  });
});
