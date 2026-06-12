import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../test-utils";
import StatTable, {
  type StatTableColumn,
} from "../components/data-display/StatTable";

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
    render(<StatTable rows={rows} columns={columns} />);

    expect(screen.getByText("NAME")).toBeInTheDocument();
    expect(screen.getByText("VALUE")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders empty message when no rows are provided", () => {
    render(
      <StatTable rows={[]} columns={columns} emptyMessage="Empty table" />,
    );

    expect(screen.getByText("Empty table")).toBeInTheDocument();
  });
});
