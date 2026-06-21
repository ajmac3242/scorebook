import { renderWithProviders as render, screen } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import RosterTab from "./RosterTab";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSortedRoster = [
  {
    id: "p1",
    name: "John Doe",
    avatarColor: "blue",
    roster: [],
    synced: 0,
  },
];

const mockSortedRosterJerseyMap = new Map([["p1", "10"]]);
const mockAggregatedStats = [
  {
    id: "p1",
    gp: 5,
    points: 15,
  },
] as unknown as Parameters<typeof RosterTab>[0]["aggregatedStats"];

describe("RosterTab", () => {
  it("renders empty state when roster is empty", async () => {
    const user = userEvent.setup();
    const onManageRoster = vi.fn();
    render(
      <RosterTab
        sortedRoster={[]}
        sortedRosterJerseyMap={new Map()}
        aggregatedStats={[]}
        isDeleted={false}
        teamId="t1"
        team={undefined}
        onManageRoster={onManageRoster}
      />,
    );

    expect(screen.getByText(/No players on this roster/i)).toBeInTheDocument();
    const addPlayersButton = screen.getByRole("button", {
      name: /Add players/i,
    });
    await user.click(addPlayersButton);
    expect(onManageRoster).toHaveBeenCalled();
  });

  it("renders roster list when players are provided", () => {
    render(
      <RosterTab
        sortedRoster={mockSortedRoster}
        sortedRosterJerseyMap={mockSortedRosterJerseyMap}
        aggregatedStats={mockAggregatedStats}
        isDeleted={false}
        teamId="t1"
        team={undefined}
        onManageRoster={vi.fn()}
      />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText(/#10 · 5 GP/i)).toBeInTheDocument();
    expect(screen.getByText("15.0")).toBeInTheDocument();
    expect(screen.getByText("PPG")).toBeInTheDocument();
  });

  it("navigates to player page when a player card is clicked", async () => {
    const user = userEvent.setup();
    render(
      <RosterTab
        sortedRoster={mockSortedRoster}
        sortedRosterJerseyMap={mockSortedRosterJerseyMap}
        aggregatedStats={mockAggregatedStats}
        isDeleted={false}
        teamId="t1"
        team={undefined}
        onManageRoster={vi.fn()}
      />,
    );

    const playerCard = screen.getByLabelText(
      /Open John Doe's player dashboard/i,
    );
    await user.click(playerCard);
    expect(mockNavigate).toHaveBeenCalledWith("/players/p1?teamId=t1");
  });

  it("calls onManageRoster when Manage Roster button is clicked", async () => {
    const user = userEvent.setup();
    const onManageRoster = vi.fn();
    render(
      <RosterTab
        sortedRoster={mockSortedRoster}
        sortedRosterJerseyMap={mockSortedRosterJerseyMap}
        aggregatedStats={mockAggregatedStats}
        isDeleted={false}
        teamId="t1"
        team={undefined}
        onManageRoster={onManageRoster}
      />,
    );

    const manageRosterButton = screen.getByRole("button", {
      name: /Manage roster/i,
    });
    await user.click(manageRosterButton);
    expect(onManageRoster).toHaveBeenCalled();
  });
});
