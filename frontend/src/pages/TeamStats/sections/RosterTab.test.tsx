import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import RosterTab from "./RosterTab";
import React from "react";

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
  {
    id: "p2",
    name: "Alice Smith",
    avatarColor: "red",
    roster: [],
    synced: 0,
  },
];

const mockSortedRosterJerseyMap = new Map([
  ["p1", "10"],
  ["p2", "23"],
]);

const mockAggregatedStats = [
  {
    id: "p1",
    gp: 5,
    points: 15,
    rebounds: 8,
    assists: 4,
  },
  {
    id: "p2",
    gp: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
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

  it("renders empty state with no button when roster is empty and team is deleted", () => {
    render(
      <RosterTab
        sortedRoster={[]}
        sortedRosterJerseyMap={new Map()}
        aggregatedStats={[]}
        isDeleted={true}
        teamId="t1"
        team={undefined}
        onManageRoster={vi.fn()}
      />,
    );

    expect(screen.getByText(/No players on this roster/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Add players/i }),
    ).not.toBeInTheDocument();
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

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("#23")).toBeInTheDocument();
    expect(screen.getByText(/#23 · No games tracked yet/i)).toBeInTheDocument();
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

  it("filters roster by player name or jersey number", async () => {
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

    const searchInput = screen.getByPlaceholderText(/Search roster/i);

    // Search by name
    await user.type(searchInput, "John");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Search by jersey number
    await user.type(searchInput, "23");
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("renders no results empty state when search matches nothing", async () => {
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

    const searchInput = screen.getByPlaceholderText(/Search roster/i);
    await user.type(searchInput, "NonexistentPlayer");

    expect(
      screen.getByText(/No results for "NonexistentPlayer"/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Try adjusting your search to find a player on this roster/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Add players/i }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
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
    await assertAccessible(container);
  });
});
