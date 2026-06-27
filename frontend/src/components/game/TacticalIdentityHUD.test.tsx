import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders,
  screen,
  assertAccessible,
  act,
} from "../../test-utils";
import { TacticalIdentityHUD, IdentityKPI } from "./TacticalIdentityHUD";

describe("TacticalIdentityHUD", () => {
  const kpis: IdentityKPI[] = [
    {
      name: "stop_pct",
      value: 65.5,
      target: 60,
      label: "Stop %",
      isPercentage: true,
    },
    {
      name: "efg",
      value: "52.0",
      target: 50,
      label: "eFG%",
      isPercentage: true,
    },
    { name: "paint_touches", value: 12, target: 15, label: "Paint Touches" },
    {
      name: "turnover_rate",
      value: 18,
      target: 15,
      label: "TO Rate",
      inverse: true,
    },
  ];

  it("renders all KPIs correctly", async () => {
    await act(async () => {
      renderWithProviders(<TacticalIdentityHUD kpis={kpis} />);
    });

    expect(screen.getByText("STOP %")).toBeInTheDocument();
    expect(screen.getByText("65.5%")).toBeInTheDocument();
    expect(screen.getByText("52.0%")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("handles empty descriptions for unknown KPIs", async () => {
    const unknownKpis: IdentityKPI[] = [
      { name: "unknown", value: 10, target: 5, label: "Unknown" },
    ];
    await act(async () => {
      renderWithProviders(<TacticalIdentityHUD kpis={unknownKpis} />);
    });
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = await act(async () => {
      return renderWithProviders(<TacticalIdentityHUD kpis={kpis} />);
    });
    await assertAccessible(container);
  });
});
