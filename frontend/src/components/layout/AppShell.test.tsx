import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";

describe("AppShell Component", () => {
  it("renders children and layout elements", () => {
    render(<AppShell>Test Content</AppShell>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("contains a 'Skip to content' link", async () => {
    const user = userEvent.setup();
    render(<AppShell>Test Content</AppShell>);

    const skipLink = screen.getByRole("link", { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Test that it's visually hidden but becomes focusable (we just check focus)
    await user.tab();
    expect(skipLink).toHaveFocus();
  });

  it("renders top bar and drawer slots", () => {
    render(
      <AppShell
        topBarSlot={<div data-testid="top-bar">Top Bar</div>}
        drawerSlot={<div data-testid="drawer">Drawer</div>}
      >
        Test Content
      </AppShell>,
    );
    expect(screen.getByTestId("top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("drawer")).toBeInTheDocument();
  });
});
