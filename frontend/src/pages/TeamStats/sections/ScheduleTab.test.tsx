import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../test-utils";
import ScheduleTab from "./ScheduleTab";
import { mockDb } from "../../../dbMock";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ScheduleTab", () => {
  const mockTeam = {
    id: "team-1",
    name: "Home Team",
    periodType: "QUARTERS" as const,
    primaryColor: "#000000",
  };

  const mockGames = [
    {
      id: "game-1",
      teamId: "team-1",
      opponent: "Opponent A",
      date: "2026-06-01",
      location: "Home",
      completed: 0,
    },
    {
      id: "game-2",
      teamId: "team-1",
      opponent: "Opponent B",
      date: "2026-06-15",
      location: "Away",
      completed: 1,
      teamScore: 80,
      oppScore: 75,
    },
  ];

  const defaultProps = {
    filteredSchedule: mockGames,
    isDeleted: false,
    teamId: "team-1",
    team: mockTeam,
    controlRadius: 8,
    onCreateGame: vi.fn(),
    isMobile: false,
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("renders the empty state when no games are provided", () => {
    renderWithProviders(
      <ScheduleTab {...defaultProps} filteredSchedule={[]} />,
    );
    expect(screen.getByText(/No games scheduled yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create first game/i }),
    ).toBeInTheDocument();
  });

  it("renders the list of games", () => {
    renderWithProviders(<ScheduleTab {...defaultProps} />);
    expect(screen.getByText(/vs Opponent A/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Opponent B/i)).toBeInTheDocument();
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Away/i)).toBeInTheDocument();
  });

  it("filters games by opponent name search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScheduleTab {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Opponent A");

    expect(screen.getByText(/vs Opponent A/i)).toBeInTheDocument();
    expect(screen.queryByText(/vs Opponent B/i)).not.toBeInTheDocument();
  });

  it("displays empty state when search returns no results", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScheduleTab {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Search opponent/i);
    await user.type(searchInput, "Nonexistent");

    expect(screen.getByText(/No games vs “Nonexistent”/i)).toBeInTheDocument();
  });

  it("navigates to game tracking when Track button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScheduleTab {...defaultProps} />);

    const trackButton = screen.getByRole("button", { name: /Track/i });
    await user.click(trackButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/game?gameId=game-1&teamId=team-1",
    );
  });

  it("navigates to game stats when a completed game card is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScheduleTab {...defaultProps} />);

    // The whole card is clickable. EntityRowCard usually has an aria-label or just the text.
    const gameCard = screen.getByLabelText(/Open game details for Opponent B/i);
    await user.click(gameCard);

    expect(mockNavigate).toHaveBeenCalledWith("/game/stats?gameId=game-2");
  });

  it("calls onCreateGame when Add Game button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScheduleTab {...defaultProps} />);

    const addGameButton = screen.getByRole("button", { name: /Add game/i });
    await user.click(addGameButton);

    expect(defaultProps.onCreateGame).toHaveBeenCalled();
  });

  it("disables actions when team is deleted", () => {
    renderWithProviders(<ScheduleTab {...defaultProps} isDeleted={true} />);

    const addGameButton = screen.getByRole("button", { name: /Add game/i });
    expect(addGameButton).toBeDisabled();

    const trackButton = screen.getByRole("button", { name: /Track/i });
    expect(trackButton).toBeDisabled();
  });
});
