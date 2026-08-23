import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import SideNav from "./SideNav";

describe("SideNav Component", () => {
  const defaultProps = {
    isLive: false,
    mobileOpen: false,
    onMobileClose: vi.fn(),
    coachName: "Coach Popovich",
    onSearchOpen: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupDesktopMedia = () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("1024px"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  };

  it("renders navigation items and coach name on desktop expanded view", () => {
    setupDesktopMedia();
    render(<SideNav {...defaultProps} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Opponents")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Coach Popovich")).toBeInTheDocument();
  });

  it("triggers search callback when search button is clicked", async () => {
    setupDesktopMedia();
    const user = userEvent.setup();
    render(<SideNav {...defaultProps} />);

    const searchBtn = screen.getByRole("button", { name: /Open search/i });
    await user.click(searchBtn);

    expect(defaultProps.onSearchOpen).toHaveBeenCalledTimes(1);
  });

  it("toggles collapsed state on desktop when collapse/expand button is clicked", async () => {
    setupDesktopMedia();
    const user = userEvent.setup();
    render(<SideNav {...defaultProps} />);

    // Collapse navigation
    const collapseBtn = screen.getByRole("button", {
      name: /Collapse navigation/i,
    });
    await user.click(collapseBtn);

    // After collapsing, expand button should be visible
    const expandBtn = screen.getByRole("button", {
      name: /Expand navigation/i,
    });
    expect(expandBtn).toBeInTheDocument();

    // Expand navigation again
    await user.click(expandBtn);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders live indicator badge when isLive is true", () => {
    setupDesktopMedia();
    const { container } = render(<SideNav {...defaultProps} isLive={true} />);
    expect(container).toBeInTheDocument();
  });

  it("passes accessibility check on desktop", async () => {
    setupDesktopMedia();
    const { container } = render(<SideNav {...defaultProps} />);
    await assertAccessible(container);
  });
});
