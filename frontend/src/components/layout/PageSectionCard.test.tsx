import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import PageSectionCard from "./PageSectionCard";
import { assertAccessible } from "../../test-utils";

describe("PageSectionCard", () => {
  it("renders children content correctly", () => {
    render(
      <PageSectionCard>
        <div>Test Content Inside Section Card</div>
      </PageSectionCard>,
    );

    expect(
      screen.getByText("Test Content Inside Section Card"),
    ).toBeInTheDocument();
  });

  it("applies custom sx prop styles correctly", () => {
    const { container } = render(
      <PageSectionCard sx={{ opacity: 0.5, p: 2 }}>
        <span>Custom Styled Content</span>
      </PageSectionCard>,
    );

    expect(screen.getByText("Custom Styled Content")).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it("passes accessibility assertions", async () => {
    const { container } = render(
      <PageSectionCard>
        <h2>Section Heading</h2>
        <p>Section description text.</p>
      </PageSectionCard>,
    );

    await assertAccessible(container);
  });
});
