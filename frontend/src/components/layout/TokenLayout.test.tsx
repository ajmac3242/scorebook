import React from "react";
import { describe, it, expect } from "vitest";
import {
  screen,
  renderWithProviders,
  assertAccessible,
  act,
} from "../../test-utils";
import {
  TokenPageShell,
  TokenSectionCard,
  TokenPageTitle,
  TokenSectionTitle,
} from "./TokenLayout";

describe("TokenLayout Components", () => {
  it("renders TokenPageShell correctly and passes a11y", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <TokenPageShell>
          <div>Page Shell Content</div>
        </TokenPageShell>,
      );
      container = rendered.container;
    });

    expect(screen.getByText("Page Shell Content")).toBeInTheDocument();
    await assertAccessible(container!);
  });

  it("renders TokenSectionCard correctly and passes a11y", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <TokenSectionCard>
          <div>Section Card Content</div>
        </TokenSectionCard>,
      );
      container = rendered.container;
    });

    expect(screen.getByText("Section Card Content")).toBeInTheDocument();
    await assertAccessible(container!);
  });

  it("renders TokenPageTitle and TokenSectionTitle correctly and passes a11y", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <div>
          <TokenPageTitle>Main Title</TokenPageTitle>
          <TokenSectionTitle>Section Title</TokenSectionTitle>
        </div>,
      );
      container = rendered.container;
    });

    expect(
      screen.getByRole("heading", { level: 5, name: "Main Title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 6, name: "Section Title" }),
    ).toBeInTheDocument();
    await assertAccessible(container!);
  });
});
