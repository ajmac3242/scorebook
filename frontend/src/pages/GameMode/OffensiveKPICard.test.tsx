import { vi } from "vitest";
import React from "react";
import { renderWithProviders as render, screen } from "../../test-utils";
import { OffensiveKPICard } from "./OffensiveKPICard";

vi.mock("../../components/cards/SurfaceCard", () => ({
  SurfaceCard: ({ children }: any) => <div>{children}</div>,
}));

const defaultProps = {
  paintTouchStats: { total: 12, pppt: "1.25" },
  shotROI: { avgXPts: "0.95", roi: "0.15" },
};

describe("OffensiveKPICard", () => {
  it("renders PAINT TOUCHES label and value", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText("PAINT TOUCHES")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders PTS / TOUCH label and value", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText("PTS / TOUCH")).toBeInTheDocument();
    expect(screen.getByText("1.25")).toBeInTheDocument();
  });

  it("renders xPTS / POSS label and value", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText("xPTS / POSS")).toBeInTheDocument();
    expect(screen.getByText("0.95")).toBeInTheDocument();
  });

  it("renders SHOT ROI label", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText("SHOT ROI")).toBeInTheDocument();
  });

  it("renders positive ROI with + prefix", () => {
    render(
      <OffensiveKPICard
        {...defaultProps}
        shotROI={{ avgXPts: "0.95", roi: "0.15" }}
      />,
    );
    expect(screen.getByText(/\+15%/)).toBeInTheDocument();
  });

  it("renders negative ROI without + prefix", () => {
    render(
      <OffensiveKPICard
        {...defaultProps}
        shotROI={{ avgXPts: "0.80", roi: "-0.10" }}
      />,
    );
    expect(screen.getByText(/-10%/)).toBeInTheDocument();
  });

  it("renders Offensive Identity section header", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText(/offensive identity/i)).toBeInTheDocument();
  });

  it("renders Quality Control section header", () => {
    render(<OffensiveKPICard {...defaultProps} />);
    expect(screen.getByText(/quality control/i)).toBeInTheDocument();
  });
});
