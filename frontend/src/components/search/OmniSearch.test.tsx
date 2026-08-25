import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import OmniSearch from "./OmniSearch";

describe("OmniSearch", () => {
  it("does not render inline expanded panel when open is false on desktop", () => {
    render(<OmniSearch open={false} onClose={vi.fn()} />);
    expect(
      screen.queryByPlaceholderText("Search players, games, teams, stats, or actions…")
    ).not.toBeInTheDocument();
  });

  it("renders search input and section headers when open is true", () => {
    render(<OmniSearch open={true} onClose={vi.fn()} />);

    expect(
      screen.getByPlaceholderText("Search players, games, teams, stats, or actions…")
    ).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("allows typing query and clearing input", async () => {
    const user = userEvent.setup();
    render(<OmniSearch open={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(
      "Search players, games, teams, stats, or actions…"
    );
    await user.type(input, "LeBron");
    expect(input).toHaveValue("LeBron");

    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);
    expect(input).toHaveValue("");
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OmniSearch open={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText(
      "Search players, games, teams, stats, or actions…"
    );
    await user.type(input, "{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<OmniSearch open={true} onClose={vi.fn()} />);
    await assertAccessible(container);
  });
});
