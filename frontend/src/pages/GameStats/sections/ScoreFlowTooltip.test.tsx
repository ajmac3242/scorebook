import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithProviders as render } from "../../../test-utils";
import { ScoreFlowTooltip } from "./ScoreFlowTooltip";
import { type ScoreFlowPoint } from "../../../utils/stats";

describe("ScoreFlowTooltip", () => {
  const shotChartJerseyMap = new Map([
    ["p1", "10"],
    ["p2", "23"],
  ]);

  it("should render nothing when not active", () => {
    const { container } = render(
      <ScoreFlowTooltip
        active={false}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render nothing when payload is empty", () => {
    const { container } = render(
      <ScoreFlowTooltip
        active={true}
        payload={[]}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render data correctly when active with payload", () => {
    const mockPoint: any = {
      time: "8:20",
      Team: 10,
      Opponent: 8,
      Spread: 2,
      teamPpp: "1.10",
      oppPpp: "0.90",
      event: "John Doe made 2pt shot",
      lineup: ["p1", "p2"],
    };

    const { getByText } = render(
      <ScoreFlowTooltip
        active={true}
        label="8:20"
        payload={[{ payload: mockPoint }]}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );

    expect(getByText(/8:20 - Spread: \+2/)).toBeInTheDocument();
    expect(getByText("John Doe made 2pt shot")).toBeInTheDocument();
    expect(getByText("10")).toBeInTheDocument();
    expect(getByText("23")).toBeInTheDocument();
    expect(getByText("1.10")).toBeInTheDocument();
    expect(getByText("0.90")).toBeInTheDocument();
  });

  it("should handle negative spread correctly", () => {
    const mockPoint: any = {
      time: "5:00",
      Team: 5,
      Opponent: 8,
      Spread: -3,
    };

    const { getByText } = render(
      <ScoreFlowTooltip
        active={true}
        label="5:00"
        payload={[{ payload: mockPoint }]}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );

    expect(getByText(/5:00 - Spread: -3/)).toBeInTheDocument();
  });

  it("should handle unknown lineup members", () => {
    const mockPoint: any = {
      time: "1:00",
      Team: 10,
      Opponent: 10,
      Spread: 0,
      lineup: ["unknown-p"],
    };

    const { getByText } = render(
      <ScoreFlowTooltip
        active={true}
        label="1:00"
        payload={[{ payload: mockPoint }]}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );

    expect(getByText("??")).toBeInTheDocument();
  });

  it("should show 'Unknown' when lineup is empty", () => {
    const mockPoint: any = {
      time: "1:00",
      Team: 10,
      Opponent: 10,
      Spread: 0,
      lineup: [],
    };

    const { getByText } = render(
      <ScoreFlowTooltip
        active={true}
        label="1:00"
        payload={[{ payload: mockPoint }]}
        shotChartJerseyMap={shotChartJerseyMap}
      />,
    );

    expect(getByText("Unknown")).toBeInTheDocument();
  });
});
