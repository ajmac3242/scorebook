import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import KpiStat from "./KpiStat";

describe("KpiStat", () => {
  it("renders label and value correctly", () => {
    render(<KpiStat label="Test KPI" value="42" />);
    expect(screen.getByText("Test KPI")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<KpiStat label="Test KPI" value="42" subtitle="Sample Subtitle" />);
    expect(screen.getByText("Sample Subtitle")).toBeInTheDocument();
  });

  it("renders dash when isEmpty is true", () => {
    render(<KpiStat label="Test KPI" value="42" isEmpty={true} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
