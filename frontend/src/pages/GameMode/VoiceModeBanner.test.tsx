import { renderWithProviders as render, screen } from "../../test-utils";
import { describe, it, expect } from "vitest";
import { VoiceModeBanner } from "./VoiceModeBanner";

describe("VoiceModeBanner", () => {
  it("shows active listening state text", () => {
    render(<VoiceModeBanner isListening={true} lastTranscript="" />);
    expect(screen.getByText(/Listening for commands/i)).toBeInTheDocument();
  });

  it("shows paused state text when not listening", () => {
    render(<VoiceModeBanner isListening={false} lastTranscript="" />);
    expect(screen.getByText(/Voice Mode Paused/i)).toBeInTheDocument();
  });

  it("shows last transcript when provided", () => {
    render(
      <VoiceModeBanner isListening={true} lastTranscript="player one make" />,
    );
    expect(screen.getByText(/player one make/i)).toBeInTheDocument();
  });

  it("hides transcript section when transcript is empty", () => {
    render(<VoiceModeBanner isListening={true} lastTranscript="" />);
    expect(screen.queryByText(/Last heard/i)).not.toBeInTheDocument();
  });

  it("renders success severity when listening", () => {
    const { container } = render(
      <VoiceModeBanner isListening={true} lastTranscript="" />,
    );
    expect(
      container.querySelector(".MuiAlert-colorSuccess"),
    ).toBeInTheDocument();
  });

  it("renders warning severity when paused", () => {
    const { container } = render(
      <VoiceModeBanner isListening={false} lastTranscript="" />,
    );
    expect(
      container.querySelector(".MuiAlert-colorWarning"),
    ).toBeInTheDocument();
  });
});
