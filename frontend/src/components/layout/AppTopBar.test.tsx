import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AppTopBar from "./AppTopBar";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

describe("AppTopBar", () => {
  const defaultProps = {
    teamName: "Test Team",
    isLive: false,
    onSearchOpen: vi.fn(),
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    defaultProps.onSearchOpen.mockClear();
  });

  it("renders the team name and logo", () => {
    render(<AppTopBar {...defaultProps} />, { withAuth: false });
    expect(screen.getByText("Test Team")).toBeInTheDocument();
  });

  it("calls onSearchOpen when search button is clicked", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />, { withAuth: false });

    await user.click(screen.getByLabelText("Open search"));
    expect(defaultProps.onSearchOpen).toHaveBeenCalled();
  });

  it("renders SyncBadge in offline mode by default", () => {
    render(<AppTopBar {...defaultProps} />, { withAuth: false });
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("renders SyncBadge in live mode when isLive is true", () => {
    render(<AppTopBar {...defaultProps} isLive={true} />, { withAuth: false });
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("has accessible buttons with tooltips", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />, { withAuth: false });

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

  it("renders with default props if teamName is omitted", () => {
    render(<AppTopBar onSearchOpen={defaultProps.onSearchOpen} />, {
      withAuth: false,
    });
    expect(screen.getByText("My Team")).toBeInTheDocument();
  });

  it("navigates to /teams when team switcher chip is clicked", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />, { withAuth: false });

    const teamChip = screen.getByRole("button", {
      name: /Active team: Test Team/i,
    });
    await user.click(teamChip);
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });

  it("navigates to /teams when Enter is pressed on the team switcher chip", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />, { withAuth: false });

    const teamChip = screen.getByRole("button", {
      name: /Active team: Test Team/i,
    });

    teamChip.focus();
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });

  it("navigates to /teams when Space is pressed on the team switcher chip", async () => {
    const user = userEvent.setup();
    render(<AppTopBar {...defaultProps} />, { withAuth: false });

    const teamChip = screen.getByRole("button", {
      name: /Active team: Test Team/i,
    });

    teamChip.focus();
    await user.keyboard(" ");
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });
});
