import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import PlayerIdentityPreview from "./PlayerIdentityPreview";

describe("PlayerIdentityPreview", () => {
  const defaultProps = {
    playerName: "LeBron James",
    avatarColor: "#1E88E5",
    isStar: false,
  };

  it("renders player name and default active status", () => {
    render(<PlayerIdentityPreview {...defaultProps} />);

    expect(screen.getByText("LeBron James")).toBeInTheDocument();
    expect(screen.getByText("Active player")).toBeInTheDocument();
    expect(screen.getByText("LJ")).toBeInTheDocument();
    expect(screen.queryByTestId("StarIcon")).not.toBeInTheDocument();
  });

  it("handles fallback default player name when blank or empty", () => {
    render(
      <PlayerIdentityPreview
        {...defaultProps}
        playerName=""
      />,
    );

    expect(screen.getByText("New player")).toBeInTheDocument();
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("renders star icon badge when isStar is true", () => {
    render(
      <PlayerIdentityPreview
        {...defaultProps}
        isStar={true}
      />,
    );

    expect(screen.getByTestId("StarIcon")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PlayerIdentityPreview {...defaultProps} />);
    await assertAccessible(container);
  });
});
