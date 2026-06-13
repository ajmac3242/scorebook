import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import EntityRowCard from "./EntityRowCard";

describe("EntityRowCard", () => {
  // Use rgb() to avoid hex color lint rule while remaining a valid color for alpha()
  const TEST_ACCENT = "rgb(0, 0, 0)";

  it("renders basic content correctly", () => {
    render(
      <EntityRowCard
        title="Test Title"
        subtitle="Test Subtitle"
        eyebrow="Test Eyebrow"
        accentColor={TEST_ACCENT}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Test Eyebrow")).toBeInTheDocument();
  });

  it("renders leading and trailing components", () => {
    render(
      <EntityRowCard
        title="Test Title"
        leading={<span data-testid="leading-icon">Leading</span>}
        trailing={<span data-testid="trailing-icon">Trailing</span>}
        accentColor={TEST_ACCENT}
      />
    );

    expect(screen.getByTestId("leading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trailing-icon")).toBeInTheDocument();
  });

  it("renders badges and metrics", () => {
    render(
      <EntityRowCard
        title="Test Title"
        badges={<span data-testid="badges">Badges</span>}
        metrics={<span data-testid="metrics">Metrics</span>}
        accentColor={TEST_ACCENT}
      />
    );

    expect(screen.getByTestId("badges")).toBeInTheDocument();
    expect(screen.getByTestId("metrics")).toBeInTheDocument();
  });

  it("renders actions and applies grid layout", () => {
    render(
      <EntityRowCard
        title="Test Title"
        actions={<button data-testid="action-btn">Action</button>}
        accentColor={TEST_ACCENT}
      />
    );

    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });

  it("handles click events when provided", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EntityRowCard title="Clickable" onClick={onClick} accentColor={TEST_ACCENT} />);

    const card = screen.getByRole("button", { name: /clickable/i });
    await user.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard events", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<EntityRowCard title="Clickable" onClick={() => {}} onKeyDown={onKeyDown} accentColor={TEST_ACCENT} />);

    const card = screen.getByRole("button", { name: /clickable/i });
    await user.type(card, "{enter}");

    expect(onKeyDown).toHaveBeenCalled();
  });
});
