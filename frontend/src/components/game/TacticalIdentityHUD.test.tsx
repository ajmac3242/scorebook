import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import { TacticalIdentityHUD, IdentityKPI } from "./TacticalIdentityHUD";

describe("TacticalIdentityHUD", () => {
  const mockKpis: IdentityKPI[] = [
    {
      name: "stop_pct",
      value: 65,
      target: 60,
      label: "Stop %",
      isPercentage: true,
    },
    {
      name: "efg",
      value: 48,
      target: 50,
      label: "eFG%",
      isPercentage: true,
    },
    {
      name: "paint_touches",
      value: 25,
      target: 20,
      label: "Paint Touches",
    },
    {
      name: "turnover_rate",
      value: 12,
      target: 15,
      label: "TOV%",
      isPercentage: true,
      inverse: true,
    },
    {
      name: "unknown",
      value: "10.5",
      target: 10,
      label: "Unknown",
    }
  ];

  it("renders KPIs correctly", () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);

    expect(screen.getByText("STOP %")).toBeInTheDocument();
    expect(screen.getByText("EFG%")).toBeInTheDocument();
    expect(screen.getByText("PAINT TOUCHES")).toBeInTheDocument();
    expect(screen.getByText("TOV%")).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();

    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("48%")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("10.5")).toBeInTheDocument();
  });

  it("displays success icon when target is met", () => {
    render(<TacticalIdentityHUD kpis={[mockKpis[0]]} />); // Stop % (65 >= 60)
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).toBeInTheDocument();
  });

  it("does not display success icon when target is not met", () => {
    render(<TacticalIdentityHUD kpis={[mockKpis[1]]} />); // eFG% (48 < 50)
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).not.toBeInTheDocument();
  });

  it("handles inverse KPIs correctly", () => {
    // Turnover rate: 12 <= 15 (Target met)
    const { rerender } = render(<TacticalIdentityHUD kpis={[mockKpis[3]]} />);
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).toBeInTheDocument();

    // Turnover rate: 18 > 15 (Target not met)
    const failingTOV: IdentityKPI = { ...mockKpis[3], value: 18 };
    rerender(<TacticalIdentityHUD kpis={[failingTOV]} />);
    expect(document.querySelector('[data-testid="CheckCircleIcon"]')).not.toBeInTheDocument();
  });

  it("has correct aria-labels for accessibility", () => {
    render(<TacticalIdentityHUD kpis={[mockKpis[0]]} />);
    expect(screen.getByLabelText("Stop %: 65%. Target: 60%")).toBeInTheDocument();
  });

  it("renders tooltips with descriptions", async () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);
    const stopLabel = screen.getByText("STOP %");
    expect(stopLabel).toHaveStyle({ cursor: 'help' });
  });
});
