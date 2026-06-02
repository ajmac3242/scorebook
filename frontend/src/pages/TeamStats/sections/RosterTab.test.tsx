import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RosterTab from "./RosterTab";
import { BrowserRouter } from "react-router-dom";
import { CourtSightThemeProvider } from "../../../theme/ThemeContext";

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
  it("renders empty state when roster is empty", () => {
    const onManageRoster = vi.fn();
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <RosterTab
            sortedRoster={[]}
            sortedRosterJerseyMap={new Map()}
            aggregatedStats={[]}
            isDeleted={false}
            teamId="t1"
            team={undefined}
            controlRadius={8}
            onManageRoster={onManageRoster}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText(/No players on this roster/i)).toBeInTheDocument();
    const addPlayersButton = screen.getByRole("button", {
      name: /Add players/i,
    });
    fireEvent.click(addPlayersButton);
    expect(onManageRoster).toHaveBeenCalled();
  });

  it("renders roster list when players are provided", () => {
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <RosterTab
            sortedRoster={mockSortedRoster}
            sortedRosterJerseyMap={mockSortedRosterJerseyMap}
            aggregatedStats={mockAggregatedStats}
            isDeleted={false}
            teamId="t1"
            team={undefined}
            controlRadius={8}
            onManageRoster={vi.fn()}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText(/5 GP · 15 PTS/i)).toBeInTheDocument();
  });

  it("navigates to player page when a player card is clicked", () => {
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <RosterTab
            sortedRoster={mockSortedRoster}
            sortedRosterJerseyMap={mockSortedRosterJerseyMap}
            aggregatedStats={mockAggregatedStats}
            isDeleted={false}
            teamId="t1"
            team={undefined}
            controlRadius={8}
            onManageRoster={vi.fn()}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    const playerCard = screen.getByLabelText(
      /Open John Doe's player dashboard/i,
    );
    fireEvent.click(playerCard);
    expect(mockNavigate).toHaveBeenCalledWith("/players/p1?teamId=t1");
  });

  it("calls onManageRoster when Manage Roster button is clicked", () => {
    const onManageRoster = vi.fn();
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <RosterTab
            sortedRoster={mockSortedRoster}
            sortedRosterJerseyMap={mockSortedRosterJerseyMap}
            aggregatedStats={mockAggregatedStats}
            isDeleted={false}
            teamId="t1"
            team={undefined}
            controlRadius={8}
            onManageRoster={onManageRoster}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    const manageRosterButton = screen.getByRole("button", {
      name: /Manage roster/i,
    });
    fireEvent.click(manageRosterButton);
    expect(onManageRoster).toHaveBeenCalled();
  });
});
