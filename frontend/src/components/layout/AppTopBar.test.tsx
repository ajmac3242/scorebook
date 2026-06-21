import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AppTopBar from "./AppTopBar";

describe("AppTopBar", () => {
  const defaultProps = {
    teamName: "Test Team",
    isLive: false,
    onSearchOpen: vi.fn(),
  };

  it("renders the team name and logo", () => {
    render(<AppTopBar {...defaultProps} />);
    expect(screen.getByText("Test Team")).toBeInTheDocument();
  });

  it("calls onSearchOpen when search button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />);

    await user.click(screen.getByLabelText("Open search"));
    expect(defaultProps.onSearchOpen).toHaveBeenCalled();
  });

  it("renders SyncBadge in offline mode by default", () => {
    render(<AppTopBar {...defaultProps} />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("renders SyncBadge in live mode when isLive is true", () => {
    render(<AppTopBar {...defaultProps} isLive={true} />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("has accessible buttons with tooltips", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />);

    const searchBtn = screen.getByLabelText("Open search");
    await user.hover(searchBtn);
    expect(await screen.findByText(/Search/i)).toBeInTheDocument();

    const notifyBtn = screen.getByLabelText("View notifications");
    await user.hover(notifyBtn);
    expect(await screen.findByText(/Notifications/i)).toBeInTheDocument();

    const avatar = screen.getByLabelText("Account settings");
    await user.hover(avatar);
    expect(await screen.findByText(/Account settings/i)).toBeInTheDocument();
  });
});
