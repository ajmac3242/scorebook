import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import Teams from "../pages/Teams";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

describe("Teams Component", () => {
  const mockSeasons = [{ id: "s1", name: "Season 1" }];
  const mockTeams = [{ id: "t1", name: "Team 1", seasonId: "s1" }];
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const mockTeamPlayers = [{ id: "tp1", teamId: "t1", playerId: "p1" }];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) return mockSeasons;
      if (code.includes("teams")) return mockTeams;
      if (code.includes("players") && !code.includes("teamPlayers"))
        return mockPlayers;
      if (code.includes("teamPlayers")) return mockTeamPlayers;
      return [];
    });
  });

  const selectSeason = async () => {
    const comboboxes = screen.getAllByRole("combobox");
    fireEvent.mouseDown(comboboxes[0]);
    const option = await screen.findByRole("option", { name: "Season 1" });
    fireEvent.click(option);
  };

  it("renders Teams page and selects season", async () => {
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /^Teams$/i, level: 3 }),
    ).toBeInTheDocument();

    await selectSeason();

    expect(
      await screen.findByRole("heading", {
        name: /^Teams$/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Team 1")).toBeInTheDocument();
  });

  it("handles fetch errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (useLiveQuery as any).mockImplementation((cb) => {
      const code = cb.toString();
      if (code.includes("seasons")) {
        cb().catch(() => {});
      }
      return [];
    });

    (db.open as any).mockRejectedValue(new Error("Fetch Error"));

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch seasons:",
        expect.any(Error),
      );
    });
  });
});
