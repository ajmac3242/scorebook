import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StatsTab from "./StatsTab";
import { BrowserRouter } from "react-router-dom";
import { PlayerAggregates } from "../../../utils/stats/types";
import { CourtSightThemeProvider } from "../../../theme/ThemeContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTokens = {
  semantic: {
    component: {
      sectionCard: {
        radius: 8,
      },
    },
  },
} as unknown as Parameters<typeof StatsTab>[0]["tokens"];

const mockPlayerStats: PlayerAggregates[] = [
  {
    id: "p1",
    name: "John Doe",
    jerseyNumber: "10",
    gp: 5,
    min: "25.5",
    points: 15,
    threePM: 2,
    threePA: 5,
    threePPct: 40,
    fgPct: 50,
    efgPct: 55,
    rebounds: 8,
    assists: 4,
    steals: 2,
    turnovers: 1,
    plusMinus: 5,
    avatarColor: "blue",
  },
];

describe("StatsTab", () => {
  it("renders empty state when no player stats are provided", () => {
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <StatsTab
            playerStats={[]}
            statView="total"
            setStatView={vi.fn()}
            gameIds={[]}
            teamId="t1"
            controlRadius={8}
            sortConfig={{ key: "points", direction: "desc" }}
            handleSort={vi.fn()}
            tokens={mockTokens}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText(/No player stats yet/i)).toBeInTheDocument();
  });

  it("renders stats table when player stats are provided", () => {
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <StatsTab
            playerStats={mockPlayerStats}
            statView="total"
            setStatView={vi.fn()}
            gameIds={["g1"]}
            teamId="t1"
            controlRadius={8}
            sortConfig={{ key: "points", direction: "desc" }}
            handleSort={vi.fn()}
            tokens={mockTokens}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("calls setStatView when toggling between Totals and Averages", () => {
    const setStatView = vi.fn();
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <StatsTab
            playerStats={mockPlayerStats}
            statView="total"
            setStatView={setStatView}
            gameIds={["g1"]}
            teamId="t1"
            controlRadius={8}
            sortConfig={{ key: "points", direction: "desc" }}
            handleSort={vi.fn()}
            tokens={mockTokens}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    const averageButton = screen.getByText("Averages");
    fireEvent.click(averageButton);
    expect(setStatView).toHaveBeenCalledWith("average");
  });

  it("calls handleSort when a sortable header is clicked", () => {
    const handleSort = vi.fn();
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <StatsTab
            playerStats={mockPlayerStats}
            statView="total"
            setStatView={vi.fn()}
            gameIds={["g1"]}
            teamId="t1"
            controlRadius={8}
            sortConfig={{ key: "points", direction: "desc" }}
            handleSort={handleSort}
            tokens={mockTokens}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    // Use a more flexible matcher for "PTS" as it might be broken up by sorting icons
    const pointsHeader = screen.getByText(/PTS/);
    fireEvent.click(pointsHeader);
    expect(handleSort).toHaveBeenCalledWith("points");
  });

  it("navigates to player page when a row is clicked", () => {
    render(
      <CourtSightThemeProvider>
        <BrowserRouter>
          <StatsTab
            playerStats={mockPlayerStats}
            statView="total"
            setStatView={vi.fn()}
            gameIds={["g1"]}
            teamId="t1"
            controlRadius={8}
            sortConfig={{ key: "points", direction: "desc" }}
            handleSort={vi.fn()}
            tokens={mockTokens}
          />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

    const row = screen.getByText("John Doe").closest("tr");
    if (!row) throw new Error("Row not found");
    fireEvent.click(row);
    expect(mockNavigate).toHaveBeenCalledWith("/players/p1?teamId=t1");
  });
});
