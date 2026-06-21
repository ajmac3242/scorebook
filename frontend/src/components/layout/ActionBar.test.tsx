import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import ActionBar from "./ActionBar";

describe("ActionBar", () => {
  const defaultProps = {
    searchValue: "",
    onSearchChange: vi.fn(),
    actionLabel: "Add Item",
    onActionClick: vi.fn(),
  };

  it("renders search field and action button", () => {
    render(<ActionBar {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", async () => {
    const user = userEvent.setup();
    render(<ActionBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("Search");
    await user.type(input, "test");
    expect(defaultProps.onSearchChange).toHaveBeenCalled();
  });

  it("calls onActionClick when button is clicked", async () => {
    const user = userEvent.setup();
    render(<ActionBar {...defaultProps} />);

    await user.click(screen.getByText("Add Item"));
    expect(defaultProps.onActionClick).toHaveBeenCalled();
  });

  it("clears search when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<ActionBar {...defaultProps} searchValue="some text" />);

    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("");
  });

  it("renders filtersSlot if provided", () => {
    render(
      <ActionBar
        {...defaultProps}
        filtersSlot={<div data-testid="custom-filter">Filter</div>}
      />,
    );
    expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
  });
});
