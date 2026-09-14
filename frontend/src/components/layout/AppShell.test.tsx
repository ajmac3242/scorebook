import React from "react";
import { describe, it, expect } from "vitest";
import { screen, renderWithProviders, assertAccessible } from "../../test-utils";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders children inside main workspace and passes accessibility checks", async () => {
    const { container } = renderWithProviders(
      <AppShell>
        <div>Test Workspace Content</div>
      </AppShell>
    );

    expect(screen.getByText("Test Workspace Content")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders custom topBarSlot and drawerSlot when provided", async () => {
    const { container } = renderWithProviders(
      <AppShell
        drawerSlot={<nav aria-label="Custom Drawer">Custom Navigation</nav>}
        topBarSlot={<header>Custom Header</header>}
      >
        <div>Content with slots</div>
      </AppShell>
    );

    expect(screen.getByText("Custom Navigation")).toBeInTheDocument();
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.getByText("Content with slots")).toBeInTheDocument();
    await assertAccessible(container);
  });
});
