import {
  cleanup,
  renderWithProviders as render,
  screen,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Teams from "../pages/Teams";
import { mockDb } from "../dbMock";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Teams Page Integration", () => {
  beforeEach(() => {
    mockDb.reset();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders and navigates to a team", async () => {
    const user = userEvent.setup();
    mockDb.seed({
      teams: [{ id: "t1", name: "Test Team", periodType: "QUARTERS" }],
    });

    render(<Teams />);

    const teamCard = await screen.findByText("Test Team");
    await user.click(teamCard);

    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");
  });

  it("opens add team dialog", async () => {
    const user = userEvent.setup();
    render(<Teams />);

    // In the DOM output we see "Create team" (small button in toolbar)
    // and "Create first team" (large button in empty state).
    // Let's target the one in the empty state specifically.
    const addBtn = await screen.findByRole("button", { name: /create first team/i });
    await user.click(addBtn);

    expect(
      screen.queryByText(/Schedule new game/i) ||
      screen.queryByText(/Create New Team/i) ||
      screen.queryByText(/Manage team roster/i) ||
      screen.queryByRole("dialog")
    ).toBeInTheDocument();
  });
});
