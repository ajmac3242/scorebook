import { describe, it, expect, vi } from "vitest";
import {
  renderWithProviders,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { OpponentScoutingPanel } from "./OpponentScoutingPanel";
import type { OpponentStat } from "../types";
import type { Player, Game } from "../../../db";

vi.mock("../hooks/useMatchupAssignment", () => ({
  useMatchupAssignment: () => ({
    handleAssignDefender: vi.fn(),
  }),
}));

describe("OpponentScoutingPanel", () => {
  const mockGame: Game = {
    id: "g1",
    teamId: "t1",
    opponent: "Rivals",
    date: "2026-08-20",
    location: "Home",
  };

  const mockPlayers: Player[] = [
    { id: "p1", teamId: "t1", name: "Player One", number: "10" },
    { id: "p2", teamId: "t1", name: "Player Zero", number: "0" },
  ];

  const mockDraftOnCourtIds = new Set(["p1", "p2"]);
  const mockJerseyMap = new Map<string, string>([
    ["p1", "10"],
    ["p2", "0"],
  ]);

  it("renders empty state when opponentStats is empty", async () => {
    const { container } = renderWithProviders(
      <OpponentScoutingPanel
        opponentStats={[]}
        game={mockGame}
        players={mockPlayers}
        draftOnCourtIds={mockDraftOnCourtIds}
        jerseyMap={mockJerseyMap}
        matchups={{}}
        gameId="g1"
      />,
      { withAuth: false },
    );

    expect(
      screen.getByText("No opponent data recorded yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start recording actions for opponent jerseys to see scouting data and assign defenders.",
      ),
    ).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("renders opponent player stats cards with HOT and CLUTCH threat badges", async () => {
    const mockOpponentStats: OpponentStat[] = [
      {
        jersey: "23",
        points: 15,
        fgm: 6,
        fga: 10,
        turnovers: 2,
        fouls: 3,
        isHot: true,
        isClutchThreat: true,
      },
      {
        jersey: "11",
        points: 4,
        fgm: 2,
        fga: 5,
        turnovers: 1,
        fouls: 1,
        isHot: false,
        isClutchThreat: false,
      },
    ];

    const { container } = renderWithProviders(
      <OpponentScoutingPanel
        opponentStats={mockOpponentStats}
        game={mockGame}
        players={mockPlayers}
        draftOnCourtIds={mockDraftOnCourtIds}
        jerseyMap={mockJerseyMap}
        matchups={{ "23": "p1" }}
        gameId="g1"
      />,
      { withAuth: false },
    );

    expect(screen.getByText("#23")).toBeInTheDocument();
    expect(screen.getByText("#11")).toBeInTheDocument();
    expect(screen.getByText("HOT")).toBeInTheDocument();
    expect(screen.getByText("CLUTCH")).toBeInTheDocument();
    expect(
      screen.getByText("15 PTS • 6/10 FG • 2 TO • 3 PF"),
    ).toBeInTheDocument();

    // Verify defender selection buttons render jersey numbers including '0'
    const assignP2Btn = screen.getByRole("button", {
      name: "Assign #0 to defend Opponent #23",
    });
    expect(assignP2Btn).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("allows clicking defender assignment button", async () => {
    const user = userEvent.setup();
    const mockOpponentStats: OpponentStat[] = [
      {
        jersey: "23",
        points: 8,
        fgm: 3,
        fga: 5,
        turnovers: 0,
        fouls: 1,
      },
    ];

    renderWithProviders(
      <OpponentScoutingPanel
        opponentStats={mockOpponentStats}
        game={mockGame}
        players={mockPlayers}
        draftOnCourtIds={mockDraftOnCourtIds}
        jerseyMap={mockJerseyMap}
        matchups={{}}
        gameId="g1"
      />,
      { withAuth: false },
    );

    const assignP1Btn = screen.getByRole("button", {
      name: "Assign #10 to defend Opponent #23",
    });
    await user.click(assignP1Btn);
    expect(assignP1Btn).toBeInTheDocument();
  });
});
