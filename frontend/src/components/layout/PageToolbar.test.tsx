import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import { PageToolbar } from "./PageToolbar";

describe("PageToolbar", () => {
  const defaultProps = {
    searchValue: "",
    onSearchChange: vi.fn(),
    primaryLabel: "Add Item",
    onPrimaryClick: vi.fn(),
  };

  it("renders search input and primary button correctly", () => {
    render(<PageToolbar {...defaultProps} placeholder="Filter items..." />);

    expect(screen.getByPlaceholderText("Filter items...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Item" }),
    ).toBeInTheDocument();
  });

  it("calls onSearchChange when user types into search input", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<PageToolbar {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByRole("textbox", { name: "Search" });
    await user.type(searchInput, "LeBron");

    expect(onSearchChange).toHaveBeenCalled();
  });

  it("renders clear button when searchValue is present and calls onClearSearch when clicked", async () => {
    const user = userEvent.setup();
    const onClearSearch = vi.fn();
    render(
      <PageToolbar
        {...defaultProps}
        searchValue="Curry"
        onClearSearch={onClearSearch}
      />,
    );

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onSearchChange with empty string when clear button is clicked without onClearSearch handler", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <PageToolbar
        {...defaultProps}
        searchValue="Durant"
        onSearchChange={onSearchChange}
      />,
    );

    const clearBtn = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearBtn);

    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("calls onPrimaryClick when primary action button is clicked", async () => {
    const user = userEvent.setup();
    const onPrimaryClick = vi.fn();
    render(<PageToolbar {...defaultProps} onPrimaryClick={onPrimaryClick} />);

    const primaryBtn = screen.getByRole("button", { name: "Add Item" });
    await user.click(primaryBtn);

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it("disables primary button when primaryDisabled is true", () => {
    render(<PageToolbar {...defaultProps} primaryDisabled />);

    const primaryBtn = screen.getByRole("button", { name: "Add Item", hidden: true });
    expect(primaryBtn).toBeDisabled();
  });

  it("passes accessibility assertions", async () => {
    const { container } = render(
      <PageToolbar
        {...defaultProps}
        searchValue="Active search"
        onClearSearch={vi.fn()}
      />,
    );

    await assertAccessible(container);
  });
});
