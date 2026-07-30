import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Unmock AnimatedNumber so we can test the actual implementation!
vi.unmock("./AnimatedNumber");

import { renderWithProviders as render, screen, act } from "../../test-utils";
import { AnimatedNumber } from "./AnimatedNumber";

describe("AnimatedNumber", () => {
  const registry = new Map<number, (timestamp: number) => void>();
  let currentId = 0;
  let originalRAF: any;
  let originalCAF: any;
  let originalGlobalRAF: any;
  let originalGlobalCAF: any;

  beforeEach(() => {
    registry.clear();
    currentId = 0;
    originalRAF = window.requestAnimationFrame;
    originalCAF = window.cancelAnimationFrame;
    originalGlobalRAF = (globalThis as any).requestAnimationFrame;
    originalGlobalCAF = (globalThis as any).cancelAnimationFrame;

    const mockRAF = (cb: FrameRequestCallback): number => {
      currentId++;
      registry.set(currentId, cb);
      return currentId;
    };

    const mockCAF = (id: number): void => {
      registry.delete(id);
    };

    window.requestAnimationFrame = mockRAF;
    window.cancelAnimationFrame = mockCAF;
    (globalThis as any).requestAnimationFrame = mockRAF;
    (globalThis as any).cancelAnimationFrame = mockCAF;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
    window.cancelAnimationFrame = originalCAF;
    (globalThis as any).requestAnimationFrame = originalGlobalRAF;
    (globalThis as any).cancelAnimationFrame = originalGlobalCAF;
  });

  it("renders the initial value formatted with decimals", () => {
    render(<AnimatedNumber value={42.56} decimals={1} />);
    expect(screen.getByText("42.6")).toBeInTheDocument();
  });

  it("animates value from previous to new value", async () => {
    const { rerender } = render(
      <AnimatedNumber value={10} duration={100} decimals={0} />,
    );
    expect(screen.getByText("10")).toBeInTheDocument();

    // Trigger update with a new target value - wrapped in act to flush effects!
    await act(async () => {
      rerender(<AnimatedNumber value={20} duration={100} decimals={0} />);
    });

    // Get the current active callback
    let activeCallbacks = Array.from(registry.values());
    expect(activeCallbacks.length).toBeGreaterThan(0);
    const stepCb = activeCallbacks[activeCallbacks.length - 1];

    // Step with initial timestamp to start
    await act(async () => {
      stepCb(1000);
    });

    // Step halfway (progress 0.5)
    activeCallbacks = Array.from(registry.values());
    expect(activeCallbacks.length).toBeGreaterThan(0);
    const nextStepCb = activeCallbacks[activeCallbacks.length - 1];
    await act(async () => {
      nextStepCb(1050); // 50ms progress out of 100ms duration
    });
    expect(screen.getByText("15")).toBeInTheDocument();

    // Step fully (progress 1.0)
    activeCallbacks = Array.from(registry.values());
    const finalStepCb = activeCallbacks[activeCallbacks.length - 1];
    await act(async () => {
      finalStepCb(1100); // 100ms progress out of 100ms duration
    });
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
