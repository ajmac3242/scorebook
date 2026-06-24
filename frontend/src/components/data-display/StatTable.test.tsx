import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import StatTable, { StatTableColumn } from "./StatTable";

describe("StatTable", () => {
  type Row = { id: string; name: string; pts: number };
  const columns: StatTableColumn<Row>[] = [
    { key: "name", label: "Name" },
    { key: "pts", label: "PTS" },
  ];
  const rows: Row[] = [
    { id: "1", name: "Player 1", pts: 20 },
    { id: "2", name: "Player 2", pts: 15 },
  ];

  it("renders table headers and data", () => {
    render(<StatTable columns={columns} rows={rows} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("PTS")).toBeInTheDocument();
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders empty message when no rows provided", () => {
    render(
      <StatTable columns={columns} rows={[]} emptyMessage="Nothing here" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
