import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../test-utils";
import Reports from "./Reports";

describe("Reports Page", () => {
  it("renders the Reports title and empty state", () => {
    renderWithProviders(<Reports />);
    // Use getAllByText because it appears in both the title and the EmptyState
    const titles = screen.getAllByText("Reports");
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /View season and game reports here. Detailed analytics and performance summaries are coming soon./i,
      ),
    ).toBeInTheDocument();
  });
});
