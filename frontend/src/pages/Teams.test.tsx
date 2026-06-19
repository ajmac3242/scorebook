import {
  cleanup,
  renderWithProviders as render,
  screen,
  waitFor,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Teams from "../pages/Teams";
import { mockDb } from "../dbMock";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
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

    const addBtn = await screen.findByRole("button", { name: /add team/i });
    await user.click(addBtn);

    expect(screen.getByText(/Schedule new game/i) || screen.getByText(/Create New Team/i)).toBeInTheDocument();
  });
});
