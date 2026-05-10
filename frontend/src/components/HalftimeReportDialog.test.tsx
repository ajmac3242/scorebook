import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HalftimeReportDialog from "./HalftimeReportDialog";

describe("HalftimeReportDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    teamPpp: "1.05",
    oppPpp: "0.95",
    seasonPpp: "1.10",
    topLineups: [
      {
        lineup: ["p1", "p2", "p3", "p4", "p5"],
        pointsFor: 10,
        pointsAgainst: 5,
        netRating: 5,
        seconds: 300,
        netRatingPer40: "40.0",
      },
    ],
    bottomLineups: [
      {
        lineup: ["p6", "p7", "p8", "p9", "p10"],
        pointsFor: 5,
        pointsAgainst: 10,
        netRating: -5,
        seconds: 300,
        netRatingPer40: "-40.0",
      },
    ],
    opponentThreats: [
      {
        playerId: "OPPONENT:12",
        points: 15,
        straightPoints: 8,
        usageRate: 35,
        efg: "60.0",
      },
    ],
    schemeEfficiency: [
      { name: "MAN", ppp: "0.90", possessions: 10 },
      { name: "ZONE", ppp: "1.20", possessions: 5 },
    ],
    jerseyMap: new Map([
      ["p1", "1"],
      ["p2", "2"],
      ["p3", "3"],
      ["p4", "4"],
      ["p5", "5"],
      ["p6", "6"],
      ["p7", "7"],
      ["p8", "8"],
      ["p9", "9"],
      ["p10", "10"],
    ]),
  };

  it("renders correctly when open", () => {
    render(<HalftimeReportDialog {...defaultProps} />);
    expect(screen.getByText("Halftime Tactical Report")).toBeInTheDocument();
    expect(screen.getByText("1.05")).toBeInTheDocument();
    expect(screen.getByText("0.95")).toBeInTheDocument();
    expect(screen.getByText("1.10")).toBeInTheDocument();
    expect(screen.getByText("MAN")).toBeInTheDocument();
    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("8 STRAIGHT")).toBeInTheDocument();
  });

  it("calls onClose when Back to Game is clicked", () => {
    render(<HalftimeReportDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Back to Game"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles copy to clipboard", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<HalftimeReportDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Copy"));

    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("renders empty state for schemes", () => {
    render(<HalftimeReportDialog {...defaultProps} schemeEfficiency={[]} />);
    expect(
      screen.getByText("No defensive data for this half."),
    ).toBeInTheDocument();
  });

  it("renders empty state for opponent threats", () => {
    render(<HalftimeReportDialog {...defaultProps} opponentThreats={[]} />);
    expect(
      screen.getByText("No major opponent threats detected this half."),
    ).toBeInTheDocument();
  });

  it("shows performing below season average warning", () => {
    render(<HalftimeReportDialog {...defaultProps} />);
    expect(
      screen.getByText(/Performing 0.05 below season average/),
    ).toBeInTheDocument();
  });
});
