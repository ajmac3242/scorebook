import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, assertAccessible } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Reports from "./Reports";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: Record<string, any> = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Reports Page", () => {
  it("renders the Reports title and empty state", async () => {
    const { container } = renderWithProviders(<Reports />);
    // Use getAllByText because it appears in both the title and the EmptyState
    const titles = screen.getAllByText("Reports");
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /View season and game reports here. Detailed analytics and performance summaries are coming soon./i,
      ),
    ).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("navigates to / when 'Go to Dashboard' button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Reports />);

    const button = screen.getByRole("button", {
      name: /Go to Dashboard/i,
    });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
