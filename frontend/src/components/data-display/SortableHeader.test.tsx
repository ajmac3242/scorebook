import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import SortableHeader from "./SortableHeader";
import { Table, TableBody, TableRow } from "@mui/material";

describe("SortableHeader", () => {
  const defaultProps = {
    label: "Points",
    sortKey: "pts",
    sortConfig: { key: "pts", direction: "desc" as const },
    onSort: vi.fn(),
  };

  const renderInTable = (element: React.ReactElement) => {
    return render(
      <Table>
        <TableBody>
          <TableRow>{element}</TableRow>
        </TableBody>
      </Table>,
    );
  };

  it("renders with label and arrow direction", () => {
    renderInTable(<SortableHeader {...defaultProps} />);
    expect(screen.getByText(/Points/)).toBeInTheDocument();
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it("renders with ascending arrow when direction is asc", () => {
    renderInTable(
      <SortableHeader
        {...defaultProps}
        sortConfig={{ key: "pts", direction: "asc" }}
      />,
    );
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it("does not render arrow when sortKey does not match config key", () => {
    renderInTable(
      <SortableHeader
        {...defaultProps}
        sortConfig={{ key: "ast", direction: "desc" }}
      />,
    );
    expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
  });

  it("calls onSort on click", async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    renderInTable(<SortableHeader {...defaultProps} onSort={onSort} />);

    await user.click(screen.getByRole("cell"));
    expect(onSort).toHaveBeenCalledWith("pts");
  });

  it("renders tooltip when specified", async () => {
    const user = userEvent.setup();
    renderInTable(
      <SortableHeader {...defaultProps} tooltip="Sort by Points" />,
    );

    const headerCell = screen.getByRole("cell");
    await user.hover(headerCell);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderInTable(<SortableHeader {...defaultProps} />);
    await assertAccessible(container);
  });
});
