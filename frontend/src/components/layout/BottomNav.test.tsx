import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import BottomNav from "./BottomNav";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

describe("BottomNav Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders navigation items when mobile view is active", async () => {
    const user = userEvent.setup();
    // Set matchMedia to simulate mobile width
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width") || query.includes("down"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<BottomNav isLive={true} />);

    // Check bottom navigation action buttons
    const dashBtn = screen.getByRole("button", { name: "Dash" });
    expect(dashBtn).toBeInTheDocument();

    await user.click(dashBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/");

    if (container) {
      await assertAccessible(container);
    }
  });

  it("returns null on desktop viewports", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<BottomNav isLive={false} />);
    expect(container.firstChild).toBeNull();
  });
});
