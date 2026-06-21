import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import ScheduleTab from "./ScheduleTab";
import { buildGame, buildTeam } from "../../../test-factories";
import dayjs from "dayjs";

describe("ScheduleTab", () => {
  const mockTeam = buildTeam({ id: "t1", name: "Our Team", primaryColor: "#FF0000" });
  const mockGames = [
    buildGame({
      id: "g1",
      opponent: "Rival A",
      date: "2023-10-10",
      time: "18:00",
      location: "Home",
      completed: 0,
    }),
    buildGame({
      id: "g2",
      opponent: "Rival B",
      date: "2023-09-10",
      completed: 1,
      teamScore: 80,
      oppScore: 70,
    }),
  ];

  const defaultProps = {
    filteredSchedule: mockGames,
    isDeleted: false,
    teamId: "t1",
    team: mockTeam,
    onCreateGame: vi.fn(),
    isMobile: false,
  };

  it("renders the list of games", () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText(/vs Rival A/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Rival B/i)).toBeInTheDocument();
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
  });

  it("filters games by opponent name", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Rival A");

    expect(screen.getByText(/vs Rival A/i)).toBeInTheDocument();
    expect(screen.queryByText(/vs Rival B/i)).not.toBeInTheDocument();
  });

  it("renders empty state when no games match search", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Nonexistent");

    expect(screen.getByText(/No games vs “Nonexistent”/i)).toBeInTheDocument();
  });

  it("renders scores and outcome badge for completed games", () => {
    render(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("calls onCreateGame when create button is clicked in empty state", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} filteredSchedule={[]} />);

    await user.click(screen.getByText(/Create first game/i));
    expect(defaultProps.onCreateGame).toHaveBeenCalled();
  });
});
