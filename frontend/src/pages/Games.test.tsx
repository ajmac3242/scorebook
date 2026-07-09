import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../test-utils";
import Games from "./Games";

describe("Games Page", () => {
  it("renders the Games title and empty state", () => {
    renderWithProviders(<Games />);
    // Use getAllByText because it appears in both the title and the EmptyState
    const titles = screen.getAllByText("Games");
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Manage and track your games here. Historical game logs and scheduling are coming soon./i,
      ),
    ).toBeInTheDocument();
  });
});
