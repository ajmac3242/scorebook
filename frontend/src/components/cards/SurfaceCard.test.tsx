import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import { SurfaceCard } from "./SurfaceCard";

describe("SurfaceCard", () => {
  it("renders children correctly", () => {
    render(
      <SurfaceCard>
        <div>Surface Content</div>
      </SurfaceCard>,
    );

    expect(screen.getByText("Surface Content")).toBeInTheDocument();
  });

  it("passes custom props and sx to Paper component", () => {
    render(
      <SurfaceCard data-testid="custom-surface-card">
        <span>Child</span>
      </SurfaceCard>,
    );

    expect(screen.getByTestId("custom-surface-card")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SurfaceCard>
        <div>Accessible Content</div>
      </SurfaceCard>,
    );
    await assertAccessible(container);
  });
});
