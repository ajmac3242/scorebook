import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import StatRankCard from "./StatRankCard";

describe("StatRankCard", () => {
  const defaultProps = {
    label: "Points",
    value: 25.5,
    rank: 1,
    total: 12,
    percentile: 95,
  };

  it("renders label and value", () => {
    render(<StatRankCard {...defaultProps} />);
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("25.5")).toBeInTheDocument();
  });

  it("renders rank label", () => {
    render(<StatRankCard {...defaultProps} />);
    expect(screen.getByText("#1 on team")).toBeInTheDocument();
  });

  it("renders different rank labels", () => {
    const { rerender } = render(<StatRankCard {...defaultProps} rank={3} />);
    expect(screen.getByText("3rd of 12")).toBeInTheDocument();

    rerender(<StatRankCard {...defaultProps} rank={2} />);
    expect(screen.getByText("2nd of 12")).toBeInTheDocument();

    rerender(<StatRankCard {...defaultProps} rank={4} />);
    expect(screen.getByText("4th of 12")).toBeInTheDocument();
  });

  it("renders with correct percentile progression", () => {
    render(<StatRankCard {...defaultProps} percentile={95} />);
    const progressBars = screen.getAllByRole("progressbar", { hidden: true });
    // MUI CircularProgress adds value to aria-valuenow
    // The second one is the active ring with the actual percentile
    const activeRing = progressBars.find(p => p.getAttribute("aria-valuenow") === "95");
    expect(activeRing).toBeInTheDocument();
  });
});
