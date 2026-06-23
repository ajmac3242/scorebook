import { vi } from "vitest";
import React from "react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import { TrackingModeToolbar } from "./TrackingModeToolbar";

const defaultProps = {
  trackingMode: "TEAM",
  onTrackingModeChange: vi.fn(),
  voiceEnabled: false,
  onVoiceToggle: vi.fn(),
  isReadOnly: false,
  game: null,
  team: null,
};

describe("TrackingModeToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders voice toggle button with enable label when voice is off", () => {
    render(<TrackingModeToolbar {...defaultProps} voiceEnabled={false} />);
    expect(screen.getByLabelText(/enable voice mode/i)).toBeInTheDocument();
  });

  it("renders voice toggle button with disable label when voice is on", () => {
    render(<TrackingModeToolbar {...defaultProps} voiceEnabled={true} />);
    expect(screen.getByLabelText(/disable voice mode/i)).toBeInTheDocument();
  });

  it("calls onVoiceToggle when voice button is clicked", async () => {
    const user = userEvent.setup();
    render(<TrackingModeToolbar {...defaultProps} />);
    await user.click(screen.getByLabelText(/enable voice mode/i));
    expect(defaultProps.onVoiceToggle).toHaveBeenCalledTimes(1);
  });

  it("renders TEAM and OPPONENT toggle buttons", () => {
    render(<TrackingModeToolbar {...defaultProps} />);
    expect(screen.getByText(/our team/i)).toBeInTheDocument();
    expect(screen.getByText(/opponent/i)).toBeInTheDocument();
  });

  it("renders team name when team is provided", () => {
    const team = { id: "1", name: "Lakers" } as any;
    render(<TrackingModeToolbar {...defaultProps} team={team} />);
    expect(screen.getByText("Lakers")).toBeInTheDocument();
  });

  it("renders opponent name when game is provided", () => {
    const game = { id: "1", opponent: "Celtics" } as any;
    render(<TrackingModeToolbar {...defaultProps} game={game} />);
    expect(screen.getByText("Celtics")).toBeInTheDocument();
  });

  it("disables tracking mode buttons when isReadOnly is true", () => {
    render(<TrackingModeToolbar {...defaultProps} isReadOnly={true} />);
    const toggleGroup = screen.getByRole("group");
    expect(toggleGroup).toHaveAttribute("aria-disabled", "true");
  });

  it("calls onTrackingModeChange when a toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(<TrackingModeToolbar {...defaultProps} trackingMode="TEAM" />);
    await user.click(screen.getByText(/opponent/i));
    expect(defaultProps.onTrackingModeChange).toHaveBeenCalledWith("OPPONENT");
  });
});
