import React from "react";
import {
  renderWithProviders,
  screen,
  assertAccessible,
  act,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import PlayerShotChartCard from "./PlayerShotChartCard";
import { describe, it, expect, vi } from "vitest";

describe("PlayerShotChartCard", () => {
  const mockMarkers = [
    {
      id: "m1",
      x: 25,
      y: 15,
      type: "MAKE_2",
      label: "2PT Make",
      color: "#2e7d32",
      playerId: "p1",
      playerName: "LeBron James",
    },
  ];

  const mockHeatmap = {
    paint: { makes: 5, attempts: 8 },
  };

  it("renders markers view by default and handles view changes", async () => {
    const user = userEvent.setup();
    const handleViewChange = vi.fn();

    renderWithProviders(
      <PlayerShotChartCard
        shotChartView="markers"
        onShotChartViewChange={handleViewChange}
        courtMarkers={mockMarkers}
        heatmapData={mockHeatmap}
        eventCount={12}
      />,
      { withAuth: false },
    );

    expect(screen.getByText("Shot Chart")).toBeInTheDocument();
    expect(
      screen.getByText("Review each recorded shot location."),
    ).toBeInTheDocument();
    expect(screen.getByText("12 tracked events")).toBeInTheDocument();

    const heatmapButton = screen.getByRole("button", { name: "Heatmap" });
    await user.click(heatmapButton);

    expect(handleViewChange).toHaveBeenCalledWith("heatmap");
  });

  it("renders heatmap description when shotChartView is heatmap", () => {
    renderWithProviders(
      <PlayerShotChartCard
        shotChartView="heatmap"
        onShotChartViewChange={vi.fn()}
        courtMarkers={mockMarkers}
        heatmapData={mockHeatmap}
        eventCount={12}
      />,
      { withAuth: false },
    );

    expect(
      screen.getByText("See makes and attempts grouped by zone."),
    ).toBeInTheDocument();
  });

  it("handles empty or null toggle selection gracefully without calling callback", async () => {
    const user = userEvent.setup();
    const handleViewChange = vi.fn();

    renderWithProviders(
      <PlayerShotChartCard
        shotChartView="markers"
        onShotChartViewChange={handleViewChange}
        courtMarkers={mockMarkers}
        heatmapData={mockHeatmap}
        eventCount={5}
      />,
      { withAuth: false },
    );

    const markersButton = screen.getByRole("button", { name: "Markers" });
    // Clicking currently selected exclusive button in MUI ToggleButtonGroup deselects it (value null)
    await user.click(markersButton);

    expect(handleViewChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <PlayerShotChartCard
          shotChartView="markers"
          onShotChartViewChange={vi.fn()}
          courtMarkers={mockMarkers}
          heatmapData={mockHeatmap}
          eventCount={12}
        />,
        { withAuth: false },
      );
      container = rendered.container;
    });

    await assertAccessible(container!, {
      rules: { "nested-interactive": { enabled: false } },
    });
  });
});
