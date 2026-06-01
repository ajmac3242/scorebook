import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KpiStat from "../components/KpiStat";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

describe("KpiStat Component", () => {
  it("renders label and value", () => {
    render(
      <CourtSightThemeProvider>
        <KpiStat label="Total Points" value="100" />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("Total Points")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <CourtSightThemeProvider>
        <KpiStat label="Efficiency" value="1.2" subtitle="Points per possession" />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("Points per possession")).toBeInTheDocument();
  });
});
