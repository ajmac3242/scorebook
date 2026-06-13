import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SurfaceCard, AnimatedNumber } from "./SharedUI";

// Mock useNavigate - though not used by SurfaceCard anymore
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SharedUI Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SurfaceCard", () => {
    it("renders children correctly", () => {
      render(<SurfaceCard>Test Content</SurfaceCard>);
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("applies custom sx props", () => {
      const { container } = render(
        <SurfaceCard sx={{ marginTop: "10px" }}>Content</SurfaceCard>,
      );
      expect(container.firstChild).toHaveStyle("margin-top: 10px");
    });
  });

  describe("AnimatedNumber", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the initial value", () => {
      render(<AnimatedNumber value={42} />);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("updates and animates when value changes", async () => {
      const { container, rerender } = render(<AnimatedNumber value={10} />);
      expect(container.textContent).toBe("10");

      rerender(<AnimatedNumber value={20} />);

      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe("20");
    });

    it("cleans up on unmount", () => {
      const { unmount } = render(<AnimatedNumber value={10} />);
      unmount();
      // Should not throw or cause issues
      expect(true).toBe(true);
    });

    it("handles decimals", () => {
      const { container } = render(
        <AnimatedNumber value={10.5} decimals={1} />,
      );
      expect(container.textContent).toBe("10.5");
    });

    it("respects duration prop", () => {
      const { container, rerender } = render(
        <AnimatedNumber value={10} duration={100} />,
      );
      rerender(<AnimatedNumber value={20} duration={100} />);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(container.textContent).toBe("20");
    });

    it("triggers animation correctly in AnimatedNumber", () => {
      const { container, rerender } = render(<AnimatedNumber value={10} />);

      // Update value to trigger useEffect
      rerender(<AnimatedNumber value={15} />);

      // Fast forward
      act(() => {
        vi.advanceTimersByTime(250);
      });

      // Final jump
      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe("15");
    });

    it("handles multiple rapid value updates", () => {
      const { container, rerender } = render(<AnimatedNumber value={10} />);
      rerender(<AnimatedNumber value={15} />);
      rerender(<AnimatedNumber value={20} />);

      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe("20");
    });

    it("renders as span by default", () => {
      const { container } = render(<AnimatedNumber value={10} />);
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("AnimatedNumber undefined value handling", () => {
    it("initialises to 0 when value is undefined", () => {
      const { container } = render(
        <AnimatedNumber value={undefined as unknown as number} />,
      );
      // No fake timers active here — React flushes synchronously
      expect(container.textContent).toBe("0");
    });

    it("initialises to 0.00 when value is undefined and decimals=2", () => {
      const { container } = render(
        <AnimatedNumber value={undefined as unknown as number} decimals={2} />,
      );
      expect(container.textContent).toBe("0.00");
    });
  });
});
