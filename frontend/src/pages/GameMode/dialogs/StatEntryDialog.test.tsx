import {
  renderWithProviders as render,
  assertAccessible,
  screen,
  act,
} from "../../../test-utils";
import { StatEntryDialog } from "./StatEntryDialog";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  ACTION_TYPES,
  SHOT_QUALITY,
  SITUATIONS,
} from "../../../constants/stats";
import { axe } from "jest-axe";

describe("StatEntryDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockSetSelectedPlayerId = vi.fn();
  const mockSetStatType = vi.fn();
  const mockSetPoints = vi.fn();
  const mockSetPlayName = vi.fn();
  const mockSetShotQuality = vi.fn();
  const mockSetSituation = vi.fn();
  const mockSetOpponentPlayType = vi.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    isEditing: false,
    isSavingStat: false,
    trackingMode: "TEAM" as const,
    selectedPlayerId: "p1",
    setSelectedPlayerId: mockSetSelectedPlayerId,
    players: [
      { id: "p1", name: "Player 1" } as any,
      { id: "p2", name: "Player 2" } as any,
    ],
    jerseyMap: new Map([
      ["p1", "10"],
      ["p2", "20"],
    ]),
    draftOnCourtIds: new Set(["p1", "p2"]),
    playerNamesMap: new Map([
      ["p1", "Player 1"],
      ["p2", "Player 2"],
    ]),
    game: { id: "g1", opponent: "Opponent Team", foulLimit: 5 } as any,
    team: {
      id: "t1",
      name: "Home Team",
      defaultFoulLimit: 5,
      playbook: ["Pick & Roll", "Isolation"],
    } as any,
    statType: null,
    setStatType: mockSetStatType,
    points: 0,
    setPoints: mockSetPoints,
    playName: "",
    setPlayName: mockSetPlayName,
    shotQuality: null,
    setShotQuality: mockSetShotQuality,
    situation: null,
    setSituation: mockSetSituation,
    opponentPlayType: null,
    setOpponentPlayType: mockSetOpponentPlayType,
    periodLabel: "Period",
    period: 1,
    clockSeconds: 600,
    isClockRunning: false,
    oppFouls: 0,
    periodType: "QUARTER",
    statsMap: new Map(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<StatEntryDialog {...defaultProps} />);
    expect(screen.getByText("Record Action")).toBeInTheDocument();
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Period 1 | 10:00")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<StatEntryDialog {...defaultProps} />);
    await assertAccessible(container);
  });

  it("handles action selection", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} />);

    const makeBtn = screen.getByText("Make (M)");
    await user.click(makeBtn);
    expect(mockSetStatType).toHaveBeenCalledWith(ACTION_TYPES.MAKE);
  });

  it("handles player selection in TEAM mode", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} />);

    const p2Btn = screen.getByText("20");
    await user.click(p2Btn);
    expect(mockSetSelectedPlayerId).toHaveBeenCalledWith("p2");
  });

  it("handles keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} />);

    await user.keyboard("m");
    expect(mockSetStatType).toHaveBeenCalledWith(ACTION_TYPES.MAKE);

    await user.keyboard("x");
    expect(mockSetStatType).toHaveBeenCalledWith(ACTION_TYPES.MISS);
  });

  it("handles Enter key to save when valid", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.MAKE} />);

    await user.keyboard("{Enter}");
    expect(mockOnSave).toHaveBeenCalled();
  });

  it("displays offensive play chips when stat is MAKE/MISS and playbook exists", () => {
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.MAKE} />);
    expect(screen.getByText("Pick & Roll")).toBeInTheDocument();
    expect(screen.getByText("Isolation")).toBeInTheDocument();
  });

  it("handles play selection", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.MAKE} />);

    await user.click(screen.getByText("Pick & Roll"));
    expect(mockSetPlayName).toHaveBeenCalledWith("Pick & Roll");
  });

  it("handles shot quality and situation selection", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.MAKE} />);

    await user.click(screen.getByText(SHOT_QUALITY.OPEN));
    expect(mockSetShotQuality).toHaveBeenCalledWith(SHOT_QUALITY.OPEN);

    await user.click(screen.getByText(SITUATIONS.ATO));
    expect(mockSetSituation).toHaveBeenCalledWith(SITUATIONS.ATO);
  });

  it("handles point selection for MAKE", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.MAKE} />);

    await user.click(screen.getByLabelText("3 point shot"));
    expect(mockSetPoints).toHaveBeenCalledWith(3);
  });

  it("handles OPPONENT tracking mode", async () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        selectedPlayerId={null}
      />,
    );
    expect(
      screen.getByText("Opponent Jersey # (Optional)"),
    ).toBeInTheDocument();
  });

  it("handles opponent play type selection", async () => {
    const user = userEvent.setup();
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        statType={ACTION_TYPES.MAKE}
      />,
    );

    await user.click(screen.getByText("ISO"));
    expect(mockSetOpponentPlayType).toHaveBeenCalledWith("ISO");
  });

  it("displays bonus chip for opponent in bonus", () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        selectedPlayerId="OPPONENT:23"
        oppFouls={5}
        periodType="QUARTERS"
      />,
    );
    expect(screen.getByText("IN BONUS")).toBeInTheDocument();
  });

  it("displays next bonus chip for opponent", () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        selectedPlayerId="OPPONENT:23"
        oppFouls={4}
        periodType="QUARTERS"
      />,
    );
    expect(screen.getByText("NEXT: BONUS")).toBeInTheDocument();
  });

  it("displays bonus chip for halves", () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        selectedPlayerId="OPPONENT:23"
        oppFouls={7}
        periodType="HALVES"
      />,
    );
    expect(screen.getByText("IN BONUS")).toBeInTheDocument();
  });

  it("disables save and shows message when player is fouled out", () => {
    const statsMap = new Map([["p1", { fouls: 5 } as any]]);
    render(
      <StatEntryDialog
        {...defaultProps}
        statsMap={statsMap}
        statType={ACTION_TYPES.MAKE}
      />,
    );

    expect(
      screen.getByText("FOULED OUT: CANNOT RECORD ACTION"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("shows 'Saving...' and disables buttons when isSavingStat is true", () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        isSavingStat={true}
        statType={ACTION_TYPES.MAKE}
      />,
    );
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} />);
    await user.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows 'Update' instead of 'Save' when editing", () => {
    render(
      <StatEntryDialog
        {...defaultProps}
        isEditing={true}
        statType={ACTION_TYPES.MAKE}
      />,
    );
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("renders with undefined game and team gracefully", () => {
    render(
      <StatEntryDialog {...defaultProps} game={undefined} team={undefined} />,
    );
    expect(screen.getByText("Record Action")).toBeInTheDocument();
  });

  it("handles keyboard 'p' for PAINT_TOUCH", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} />);
    await user.keyboard("p");
    expect(mockSetStatType).toHaveBeenCalledWith(ACTION_TYPES.PAINT_TOUCH);
  });

  it("displays 'Team / Admin' button in TEAM mode when a foul is selected and selects OUR_TEAM on click", async () => {
    const user = userEvent.setup();
    render(<StatEntryDialog {...defaultProps} statType={ACTION_TYPES.FOUL} />);

    const teamAdminBtn = screen.getByTestId("team-admin-button");
    expect(teamAdminBtn).toBeInTheDocument();

    await user.click(teamAdminBtn);
    expect(mockSetSelectedPlayerId).toHaveBeenCalledWith("OUR_TEAM");
  });

  it("displays 'Team / Admin (No Jersey)' button in OPPONENT mode when a foul is selected and selects OPPONENT on click", async () => {
    const user = userEvent.setup();
    render(
      <StatEntryDialog
        {...defaultProps}
        trackingMode="OPPONENT"
        statType={ACTION_TYPES.FOUL}
      />,
    );

    const oppTeamAdminBtn = screen.getByTestId("opp-team-admin-button");
    expect(oppTeamAdminBtn).toBeInTheDocument();

    await user.click(oppTeamAdminBtn);
    expect(mockSetSelectedPlayerId).toHaveBeenCalledWith("OPPONENT");
  });

  it("renders Class A / Class B toggle when a technical foul is selected", async () => {
    const user = userEvent.setup();
    render(
      <StatEntryDialog
        {...defaultProps}
        statType={ACTION_TYPES.TECHNICAL_FOUL_CLASS_A}
      />,
    );

    expect(screen.getByText("Technical Foul Class")).toBeInTheDocument();
    const classABtn = screen.getByText("Class A (Conduct)");
    const classBBtn = screen.getByText("Class B (Administrative)");

    expect(classABtn).toBeInTheDocument();
    expect(classBBtn).toBeInTheDocument();

    await user.click(classBBtn);
    expect(mockSetStatType).toHaveBeenCalledWith(
      ACTION_TYPES.TECHNICAL_FOUL_CLASS_B,
    );
  });
});
