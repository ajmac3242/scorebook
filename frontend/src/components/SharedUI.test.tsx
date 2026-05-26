import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  MoleskineCard,
  PageHeader,
  StatItem,
  StatCard,
  AnimatedNumber,
} from "./SharedUI";
import { BrowserRouter } from "react-router-dom";

// Mock useNavigate
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

  describe("MoleskineCard", () => {
    it("renders children correctly", () => {
      render(<MoleskineCard>Test Content</MoleskineCard>);
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("applies custom sx props", () => {
      const { container } = render(
        <MoleskineCard sx={{ marginTop: "10px" }}>Content</MoleskineCard>,
      );
      expect(container.firstChild).toHaveStyle("margin-top: 10px");
    });
  });

  describe("PageHeader", () => {
    it("renders title and subtitle", () => {
      render(
        <BrowserRouter>
          <PageHeader title="Main Title" subtitle="Sub Title" />
        </BrowserRouter>,
      );
      expect(screen.getByText("Main Title")).toBeInTheDocument();
      expect(screen.getByText("Sub Title")).toBeInTheDocument();
    });

    it("renders actions if provided", () => {
      render(
        <BrowserRouter>
          <PageHeader title="Title" actions={<button>Action</button>} />
        </BrowserRouter>,
      );
      expect(
        screen.getByRole("button", { name: "Action" }),
      ).toBeInTheDocument();
    });

    it("navigates back when back button is clicked", () => {
      render(
        <BrowserRouter>
          <PageHeader title="Title" showBack />
        </BrowserRouter>,
      );
      const backButton = screen.getByLabelText("Go back");
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("navigates to specific path when backTo is provided", () => {
      render(
        <BrowserRouter>
          <PageHeader title="Title" showBack backTo="/home" />
        </BrowserRouter>,
      );
      const backButton = screen.getByLabelText("Go back");
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  describe("StatItem", () => {
    it("renders label and string value", () => {
      render(<StatItem label="PTS" value="10.5" />);
      expect(screen.getByText("PTS")).toBeInTheDocument();
      expect(screen.getByText("10.5")).toBeInTheDocument();
    });

    it("renders label and animated number value", () => {
      render(<StatItem label="AST" value={5} />);
      expect(screen.getByText("AST")).toBeInTheDocument();
      // Wait for animation
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  describe("StatCard", () => {
    it("renders label and value", () => {
      render(<StatCard label="REB" value="12" />);
      expect(screen.getByText("REB")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
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

    it("handles light prop in StatItem", () => {
      const { rerender } = render(
        <StatItem label="L" value="V" light={true} />,
      );
      // No crash and renders
      expect(screen.getByText("L")).toBeInTheDocument();
      expect(screen.getByText("V")).toBeInTheDocument();

      rerender(<StatItem label="L" value="V" light={false} />);
      expect(screen.getByText("V")).toBeInTheDocument();
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
