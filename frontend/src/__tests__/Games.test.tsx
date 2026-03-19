import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import Games from "../pages/Games";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Games Component", () => {
  const mockSeasons = [{ id: "s1", name: "Season 1" }];
  const mockTeams = [{ id: "t1", name: "Team 1", seasonId: "s1" }];
  const mockGames = [
    {
      id: "g1",
      opponent: "Bulls",
      date: "2024-01-01",
      location: "Home",
      teamId: "t1",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectTeam = async () => {
    const selects = screen.getAllByRole("combobox");
    const teamSelect = selects[1];
    fireEvent.mouseDown(teamSelect);
    const listbox = await screen.findByRole("listbox");
    const option = within(listbox).getByText("Team 1");
    fireEvent.click(option);
  };

  it("renders Games page and selects team", async () => {
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      if (code.includes("games")) return [];
      return [];
    });

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    expect(screen.getByText("Games Schedule")).toBeInTheDocument();

    await selectTeam();

    expect(
      await screen.findByText(/No games for this team/i),
    ).toBeInTheDocument();
  });

  it("filters by season", async () => {
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      return [];
    });

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    const seasonSelect = screen.getAllByRole("combobox")[0];
    fireEvent.mouseDown(seasonSelect);
    const option = await screen.findByText("Season 1");
    fireEvent.click(option);

    expect(seasonSelect).toHaveTextContent("Season 1");
  });

  it("adds a new game", async () => {
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      if (code.includes("games")) return [];
      return [];
    });

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    await selectTeam();

    fireEvent.click(screen.getByLabelText(/add/i));

    fireEvent.change(screen.getByLabelText(/Opponent/i), {
      target: { value: "Lakers" },
    });
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: "2024-02-02" },
    });
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: "Away" },
    });

    // The Add button in the dialog
    const dialog = await screen.findByRole("dialog");
    const addButton = within(dialog).getByRole("button", { name: "Add" });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(db.games.add).toHaveBeenCalled();
    });
  });

  it("navigates to game tracking", async () => {
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      if (code.includes("games")) return mockGames;
      return [];
    });

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    await selectTeam();

    expect(await screen.findByText(/vs Bulls/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Track/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/game?gameId=g1&teamId=t1");
  });

  it("handles fetch errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (useLiveQuery as any).mockImplementation((cb) => {
      cb().catch(() => {});
      return [];
    });
    (db.open as any).mockRejectedValue(new Error("Dexie error"));

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch seasons:",
        expect.any(Error),
      );
    });
  });

  it("handles add game error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (db.games.add as any).mockRejectedValue(new Error("Add error"));
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      return [];
    });

    render(
      <BrowserRouter>
        <Games />
      </BrowserRouter>,
    );

    await selectTeam();
    fireEvent.click(screen.getByLabelText(/add/i));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to add game:",
        expect.any(Error),
      );
    });
  });
});
