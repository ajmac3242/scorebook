import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders as render,
  screen,
  fireEvent,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { PageToolbar } from "./PageToolbar";

describe("PageToolbar Component", () => {
  const defaultProps = {
    searchValue: "",
    onSearchChange: vi.fn(),
    primaryLabel: "Add Item",
    onPrimaryClick: vi.fn(),
  };

  it("renders search input and primary button", () => {
    render(<PageToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add item/i }),
    ).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", async () => {
    const user = userEvent.setup();
    render(<PageToolbar {...defaultProps} />);
    const input = screen.getByPlaceholderText("Search");
    await user.type(input, "test");
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("t");
  });

  it("shows clear button when searchValue is present and clears search", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <PageToolbar
        {...defaultProps}
        searchValue="hello"
        onSearchChange={onSearchChange}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("calls onPrimaryClick when primary button is clicked", async () => {
    const user = userEvent.setup();
    render(<PageToolbar {...defaultProps} />);
    const primaryButton = screen.getByRole("button", { name: /add item/i });
    await user.click(primaryButton);
    expect(defaultProps.onPrimaryClick).toHaveBeenCalled();
  });

  it("disables primary button when primaryDisabled is true", () => {
    // When primaryDisabled is true, it might be hidden on mobile
    render(<PageToolbar {...defaultProps} primaryDisabled={true} />);
    const primaryButton = screen.getByLabelText("Add Item");
    expect(primaryButton).toBeDisabled();
  });
});
