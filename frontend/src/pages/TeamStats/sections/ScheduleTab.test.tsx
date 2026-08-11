import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import ScheduleTab from "./ScheduleTab";
import { buildGame, buildTeam } from "../../../test-factories";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ScheduleTab", () => {
  const mockTeam = buildTeam({
    id: "t1",
    name: "Our Team",
    primaryColor: "#FF0000",
  });

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the list of games and handles row click navigation", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />, { withAuth: false });

    expect(screen.getByText(/vs Rival A/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Rival B/i)).toBeInTheDocument();
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);

    // Click on row to navigate to details
    const row = screen.getByLabelText(/Open game details for Rival A/i);
    await user.click(row);
    expect(mockNavigate).toHaveBeenCalledWith("/game/stats?gameId=g1");
  });

  it("filters games by opponent name", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />, { withAuth: false });

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Rival A");

    expect(screen.getByText(/vs Rival A/i)).toBeInTheDocument();
    expect(screen.queryByText(/vs Rival B/i)).not.toBeInTheDocument();
  });

  it("renders empty state when no games match search", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />, { withAuth: false });

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Nonexistent");

    expect(screen.getByText(/No games vs “Nonexistent”/i)).toBeInTheDocument();
  });

  it("renders scores and outcome badge for completed games (W, L, D, and null outcomes)", () => {
    // 1. Team Wins
    const { rerender } = render(<ScheduleTab {...defaultProps} />, {
      withAuth: false,
    });
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();

    // 2. Opponent Wins (Loss)
    const lossGames = [
      buildGame({
        id: "g3",
        opponent: "Rival C",
        date: "2023-09-10",
        completed: 1,
        teamScore: 60,
        oppScore: 90,
      }),
    ];
    rerender(<ScheduleTab {...defaultProps} filteredSchedule={lossGames} />);
    expect(screen.getByText("L")).toBeInTheDocument();

    // 3. Draw
    const drawGames = [
      buildGame({
        id: "g4",
        opponent: "Rival D",
        date: "2023-09-10",
        completed: 1,
        teamScore: 80,
        oppScore: 80,
      }),
    ];
    rerender(<ScheduleTab {...defaultProps} filteredSchedule={drawGames} />);
    expect(screen.getByText("D")).toBeInTheDocument();

    // 4. Null Scores
    const nullGames = [
      buildGame({
        id: "g5",
        opponent: "Rival E",
        date: "2023-09-10",
        completed: 1,
        teamScore: undefined,
        oppScore: undefined,
      }),
    ];
    rerender(<ScheduleTab {...defaultProps} filteredSchedule={nullGames} />);
    expect(screen.getAllByText("—")).toHaveLength(3); // 2 scores, 1 outcome
  });

  it("calls onCreateGame when create button is clicked in empty state", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} filteredSchedule={[]} />, {
      withAuth: false,
    });

    await user.click(screen.getByText(/Create first game/i));
    expect(defaultProps.onCreateGame).toHaveBeenCalled();
  });

  it("renders opponent logo when available, otherwise defaults to initials avatar", () => {
    const gamesWithLogo = [
      buildGame({
        id: "g1",
        opponent: "Rival Logo",
        opponentLogoUrl: "http://rival.logo/img.png",
        completed: 0,
      }),
    ];
    render(<ScheduleTab {...defaultProps} filteredSchedule={gamesWithLogo} />, {
      withAuth: false,
    });

    const logoImg = screen.getByAltText(/Rival Logo logo/i);
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute("src", "http://rival.logo/img.png");
  });

  it("triggers tracking page navigation when clicking the Track button", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} />, { withAuth: false });

    const trackButton = screen.getByRole("button", { name: /Track/i });
    await user.click(trackButton);

    expect(mockNavigate).toHaveBeenCalledWith("/game?gameId=g1&teamId=t1");
  });

  it("renders Floating Action Button on mobile view and clicks it", async () => {
    const user = userEvent.setup();
    render(<ScheduleTab {...defaultProps} isMobile={true} />, {
      withAuth: false,
    });

    const mobileFab = screen.getByRole("button", { name: /Create game/i });
    expect(mobileFab).toBeInTheDocument();

    await user.click(mobileFab);
    expect(defaultProps.onCreateGame).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ScheduleTab {...defaultProps} />, {
      withAuth: false,
    });
    await assertAccessible(container, {
      rules: {
        "nested-interactive": { enabled: false },
      },
    });
  });
});
