import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, assertAccessible, act } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Reports from "./Reports";

describe("Reports Page", () => {
  it("renders the Reports title and empty state", async () => {
    await act(async () => {
      renderWithProviders(<Reports />, { withAuth: false });
    });
    // Use getAllByText because it appears in both the title and the EmptyState
    const titles = screen.getAllByText("Reports");
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /View season and game reports here. Detailed analytics and performance summaries are coming soon./i,
      ),
    ).toBeInTheDocument();
  });

  it("navigates to dashboard on action button click", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithProviders(<Reports />, { withAuth: false });
    });

    const dashboardBtn = screen.getByRole("button", {
      name: "Navigate to dashboard page",
    });
    expect(dashboardBtn).toBeInTheDocument();
    await user.click(dashboardBtn);
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = renderWithProviders(<Reports />, { withAuth: false });
      container = res.container;
    });
    await assertAccessible(container!);
  });
});
