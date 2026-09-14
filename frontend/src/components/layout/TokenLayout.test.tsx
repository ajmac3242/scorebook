import React from "react";
import { describe, it, expect } from "vitest";
import {
  screen,
  renderWithProviders,
  assertAccessible,
} from "../../test-utils";
import {
  TokenPageShell,
  TokenSectionCard,
  TokenPageTitle,
  TokenSectionTitle,
} from "./TokenLayout";

describe("TokenLayout Components", () => {
  it("renders TokenPageShell correctly and passes a11y", async () => {
    const { container } = renderWithProviders(
      <TokenPageShell>
        <div>Page Shell Content</div>
      </TokenPageShell>,
    );

    expect(screen.getByText("Page Shell Content")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders TokenSectionCard correctly and passes a11y", async () => {
    const { container } = renderWithProviders(
      <TokenSectionCard>
        <div>Section Card Content</div>
      </TokenSectionCard>,
    );

    expect(screen.getByText("Section Card Content")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders TokenPageTitle and TokenSectionTitle correctly and passes a11y", async () => {
    const { container } = renderWithProviders(
      <div>
        <TokenPageTitle>Main Title</TokenPageTitle>
        <TokenSectionTitle>Section Title</TokenSectionTitle>
      </div>,
    );

    expect(
      screen.getByRole("heading", { level: 5, name: "Main Title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 6, name: "Section Title" }),
    ).toBeInTheDocument();
    await assertAccessible(container);
  });
});
