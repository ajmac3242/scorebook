import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import { TacticalIdentityHUD, IdentityKPI } from "./TacticalIdentityHUD";
import React from "react";

describe("TacticalIdentityHUD", () => {
  it("renders KPIs correctly", () => {
    const kpis: IdentityKPI[] = [
      {
        name: "stop_pct",
        value: 75,
        target: 70,
        label: "Stop %",
        isPercentage: true,
      },
      {
        name: "efg",
        value: "0.55",
        target: 0.50,
        label: "eFG%",
      },
      {
        name: "paint_touches",
        value: 15,
        target: 20,
        label: "Paint Touches",
      },
      {
        name: "turnover_rate",
        value: 12,
        target: 15,
        label: "TO Rate",
        inverse: true,
      }
    ];

    render(<TacticalIdentityHUD kpis={kpis} />);

    expect(screen.getByText("STOP %")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("EFG%")).toBeInTheDocument();
    expect(screen.getByText("0.55")).toBeInTheDocument();
    expect(screen.getByText("PAINT TOUCHES")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("TO RATE")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("handles unknown KPI names for description", () => {
     const kpis: IdentityKPI[] = [
      {
        name: "unknown",
        value: 10,
        target: 10,
        label: "Unknown",
      }
    ];
    render(<TacticalIdentityHUD kpis={kpis} />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});
