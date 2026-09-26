import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
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

  it("supports actionAriaLabel, actionDisabled, and mobileActionHidden=false", () => {
    render(
      <ActionBar
        {...defaultProps}
        actionAriaLabel="Custom Action ARIA"
        actionDisabled={true}
        mobileActionHidden={false}
      />,
    );
    const btn = screen.getByRole("button", { name: "Custom Action ARIA" });
    expect(btn).toBeDisabled();
  });

  it("supports hideSearch, hideAction, and trailingSlot", () => {
    render(
      <ActionBar
        hideSearch
        hideAction
        trailingSlot={<div data-testid="trailing-slot">Trailing</div>}
      />,
    );
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
    expect(screen.getByTestId("trailing-slot")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    await assertAccessible(container);
  });
});
