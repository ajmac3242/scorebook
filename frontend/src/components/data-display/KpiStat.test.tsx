import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import KpiStat from "./KpiStat";

describe("KpiStat Component", () => {
  it("renders label and value", () => {
    render(<KpiStat label="Total Points" value="100" />);

    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <KpiStat
        label="Efficiency"
        value="1.2"
        subtitle="Points per possession"
      />,
    );

    expect(screen.getByText("Points per possession")).toBeInTheDocument();
  });

  it("renders empty state with dash placeholder and accessible label when isEmpty is true", () => {
    render(<KpiStat label="Rebounds" value="10" isEmpty={true} />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rebounds metric: No data"),
    ).toBeInTheDocument();
  });

  it("renders with custom sizes sm and lg, light theme mode, and custom value color", () => {
    const customGreen = "#00FF00";
    const { rerender } = render(
      <KpiStat
        label="Steals"
        value="5"
        size="sm"
        light={true}
        valueColor={customGreen}
      />,
    );

    expect(screen.getByText("Steals")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    rerender(<KpiStat label="Blocks" value="3" size="lg" light={true} />);

    expect(screen.getByText("Blocks")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders custom React element values correctly", () => {
    render(
      <KpiStat
        label="Rating"
        value={<span data-testid="custom-value">Top 5%</span>}
      />,
    );

    expect(screen.getByTestId("custom-value")).toHaveTextContent("Top 5%");
    expect(screen.getByLabelText("Rating metric: Rating")).toBeInTheDocument();
  });
});
