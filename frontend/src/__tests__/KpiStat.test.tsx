import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../test-utils";
import KpiStat from "../components/data-display/KpiStat";

describe("KpiStat Component", () => {
  it("renders label and value", () => {
    render(<KpiStat label="Total Points" value="100" />);

    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<KpiStat
        label="Efficiency"
        value="1.2"
        subtitle="Points per possession"
      />);

    expect(screen.getByText("Points per possession")).toBeInTheDocument();
  });
});
