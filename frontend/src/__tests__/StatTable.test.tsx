import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatTable, {
  type StatTableColumn,
} from "../components/data-display/StatTable";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

describe("StatTable Component", () => {
  type TestData = { id: number; name: string; value: number };
  const rows: TestData[] = [
    { id: 1, name: "Item 1", value: 10 },
    { id: 2, name: "Item 2", value: 20 },
  ];
  const columns: StatTableColumn<TestData>[] = [
    { key: "name", label: "NAME" },
    { key: "value", label: "VALUE", align: "right" },
  ];

  it("renders table headers and rows", () => {
    render(
      <CourtSightThemeProvider>
        <StatTable rows={rows} columns={columns} />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("VALUE")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders empty message when no rows are provided", () => {
    render(
      <CourtSightThemeProvider>
        <StatTable rows={[]} columns={columns} emptyMessage="Empty table" />
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("Empty table")).toBeInTheDocument();
  });
});
