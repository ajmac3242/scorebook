import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "../../test-utils";
import { TacticalIdentityHUD, IdentityKPI } from "./TacticalIdentityHUD";

describe("TacticalIdentityHUD", () => {
  const mockKpis: IdentityKPI[] = [
    {
      name: "stop_pct",
      value: 50.5,
      target: 60,
      label: "Stop %",
      isPercentage: true,
    },
    {
      name: "efg",
      value: "45.0",
      target: 50,
      label: "eFG%",
      isPercentage: true,
    },
    { name: "paint_touches", value: 25, target: 20, label: "Paint Touches" },
    { name: "turnovers", value: 10, target: 12, label: "TOV", inverse: true },
  ];

  it("renders all KPIs with labels and values", () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);

    expect(screen.getByText("STOP %")).toBeInTheDocument();
    expect(screen.getByText("EFG%")).toBeInTheDocument();
    expect(screen.getByText("PAINT TOUCHES")).toBeInTheDocument();

    expect(screen.getByText("50.5%")).toBeInTheDocument();
    expect(screen.getByText("45.0%")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows CheckCircle when target is met", () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);

    // Stop %: 50.5 < 60 (Not met)
    // Paint Touches: 25 > 20 (Met)
    // TOV: 10 <= 12 (Met, inverse)

    const boxes = screen.getAllByLabelText(/Target:/);
    // Find "Paint Touches" box
    const paintTouchesBox = boxes.find((b) =>
      b.getAttribute("aria-label")?.includes("Paint Touches"),
    );
    expect(
      paintTouchesBox?.querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).toBeInTheDocument();

    const stopPctBox = boxes.find((b) =>
      b.getAttribute("aria-label")?.includes("Stop %"),
    );
    expect(
      stopPctBox?.querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).not.toBeInTheDocument();

    const tovBox = boxes.find((b) =>
      b.getAttribute("aria-label")?.includes("TOV"),
    );
    expect(
      tovBox?.querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).toBeInTheDocument();
  });

  it("handles empty or unknown KPI descriptions", () => {
    const unknownKpi: IdentityKPI[] = [
      { name: "unknown", value: 1, target: 2, label: "Unknown" },
    ];
    render(<TacticalIdentityHUD kpis={unknownKpi} />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});
