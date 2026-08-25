import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, assertAccessible } from "../test-utils";
import userEvent from "@testing-library/user-event";
import Games from "./Games";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: Record<string, any> = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Games Page", () => {
  it("renders the Games title and empty state", async () => {
    const { container } = renderWithProviders(<Games />);
    // Use getAllByText because it appears in both the title and the EmptyState
    const titles = screen.getAllByText("Games");
    expect(titles.length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Manage and track your games here. Historical game logs and scheduling are coming soon./i,
      ),
    ).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("navigates to /teams when 'View Teams & Schedule' button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Games />);

    const button = screen.getByRole("button", {
      name: /Navigate to teams page to view teams and schedule/i,
    });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });
});
