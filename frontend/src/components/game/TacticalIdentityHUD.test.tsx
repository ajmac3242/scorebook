import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import { TacticalIdentityHUD, IdentityKPI } from "./TacticalIdentityHUD";

describe("TacticalIdentityHUD", () => {
  const mockKpis: IdentityKPI[] = [
    {
      name: "stop_pct",
      label: "Stop %",
      value: 75,
      target: 70,
      isPercentage: true,
    },
    {
      name: "efg",
      label: "eFG%",
      value: "45.5",
      target: 50,
      isPercentage: true,
    },
    {
      name: "turnover_rate",
      label: "TOV Rate",
      value: 12,
      target: 15,
      isPercentage: true,
      inverse: true,
    },
  ];

  it("renders all KPI cards with correct labels and values", () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);

    expect(screen.getByText("STOP %")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    expect(screen.getByText("EFG%")).toBeInTheDocument();
    expect(screen.getByText("45.5%")).toBeInTheDocument();

    expect(screen.getByText("TOV RATE")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
  });

  it("displays success checkmark when target is met", () => {
    render(<TacticalIdentityHUD kpis={mockKpis} />);

    // Stop % (75 >= 70) -> Met
    // eFG% (45.5 < 50) -> Not Met
    // TOV Rate (12 <= 15, inverse) -> Met

    // CheckCircle components are rendered for met KPIs.
    // They are SVG icons, so we check for presence.
    const kpiBoxes = screen.getAllByLabelText(/Target:/);

    // Box 0: Stop % (Met)
    expect(
      kpiBoxes[0].querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).toBeInTheDocument();

    // Box 1: eFG% (Not Met)
    expect(
      kpiBoxes[1].querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).not.toBeInTheDocument();

    // Box 2: TOV Rate (Met, inverse)
    expect(
      kpiBoxes[2].querySelector('svg[data-testid="CheckCircleIcon"]'),
    ).toBeInTheDocument();
  });

  it("renders with default description for unknown KPI names", () => {
    const unknownKpis: IdentityKPI[] = [
      {
        name: "unknown",
        label: "Unknown",
        value: 10,
        target: 20,
      },
    ];
    render(<TacticalIdentityHUD kpis={unknownKpis} />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});
