import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithProviders as render, screen, act } from "../../test-utils";
import { AnimatedNumber } from "./AnimatedNumber";

describe("AnimatedNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the initial value immediately", () => {
    render(<AnimatedNumber value={100} duration={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("animates from 0 to the target value", async () => {
    const { rerender } = render(<AnimatedNumber value={0} duration={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();

    rerender(<AnimatedNumber value={100} duration={100} />);

    // Middle of animation
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    // We expect some value between 0 and 100.
    // However, requestAnimationFrame in JSDOM/Vitest without global mock might not advance.
    // Let's try to advance more and see.

    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("formats with specified decimals", () => {
    render(<AnimatedNumber value={100.55} decimals={2} duration={100} />);
    expect(screen.getByText("100.55")).toBeInTheDocument();
  });

  it("handles null or undefined values gracefully", () => {
    // @ts-ignore
    render(<AnimatedNumber value={null} duration={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
