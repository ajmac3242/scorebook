import { render, screen } from "../../../test-utils";
import { ScoreFlowTooltip } from "./ScoreFlowTooltip";
import { describe, it, expect } from "vitest";

describe("ScoreFlowTooltip", () => {
  const mockShotChartJerseyMap = new Map([
    ["p1", "23"],
    ["p2", "30"],
  ]);

  const defaultProps = {
    active: true,
    label: "12:00",
    shotChartJerseyMap: mockShotChartJerseyMap,
    payload: [
      {
        payload: {
          time: "12:00",
          Team: 10,
          Opponent: 5,
          Spread: 5,
          event: "Made 2pt",
          lineup: ["p1", "p2"],
          teamPpp: "1.25",
          oppPpp: "1.05",
        },
      },
    ],
  };

  it("renders correctly with full data", () => {
    render(<ScoreFlowTooltip {...defaultProps} />);
    expect(screen.getByText("12:00 - Spread: +5")).toBeInTheDocument();
    expect(screen.getByText("Made 2pt")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("1.25")).toBeInTheDocument();
    expect(screen.getByText("1.05")).toBeInTheDocument();
  });

  it("renders negative spread correctly", () => {
    const props = {
      ...defaultProps,
      payload: [
        {
          payload: {
            ...defaultProps.payload[0].payload,
            Spread: -3,
          },
        },
      ],
    };
    render(<ScoreFlowTooltip {...props} />);
    expect(screen.getByText("12:00 - Spread: -3")).toBeInTheDocument();
  });

  it("renders 'Unknown' when lineup is missing", () => {
    const props = {
      ...defaultProps,
      payload: [
        {
          payload: {
            ...defaultProps.payload[0].payload,
            lineup: [],
          },
        },
      ],
    };
    render(<ScoreFlowTooltip {...props} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("renders '??' for unknown players in lineup", () => {
    const props = {
      ...defaultProps,
      payload: [
        {
          payload: {
            ...defaultProps.payload[0].payload,
            lineup: ["p3"],
          },
        },
      ],
    };
    render(<ScoreFlowTooltip {...props} />);
    expect(screen.getByText("??")).toBeInTheDocument();
  });

  it("renders default PPP when missing", () => {
    const props = {
      ...defaultProps,
      payload: [
        {
          payload: {
            ...defaultProps.payload[0].payload,
            teamPpp: undefined,
            oppPpp: undefined,
          },
        },
      ],
    };
    render(<ScoreFlowTooltip {...props} />);
    expect(screen.getAllByText("0.00")).toHaveLength(2);
  });

  it("returns null when not active", () => {
    const { container } = render(
      <ScoreFlowTooltip {...defaultProps} active={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when payload is empty", () => {
    const { container } = render(
      <ScoreFlowTooltip {...defaultProps} payload={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
