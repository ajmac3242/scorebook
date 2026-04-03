import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Teams from "../pages/Teams";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { logger } from "../utils/logger";

describe("Teams Component", () => {
  const mockTeams = [{ id: "t1", name: "Team 1", description: "Test Team" }];
  const mockPlayers = [{ id: "p1", name: "Player 1", avatarColor: "#4E7D5B" }];
  const mockTeamPlayers = [{ id: "tp1", teamId: "t1", playerId: "p1" }];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("teams")) return mockTeams;
        if (code.includes("players") && !code.includes("teamPlayers"))
          return mockPlayers;
        if (code.includes("teamPlayers")) return mockTeamPlayers;
        return [];
      },
    );
  });

  it("renders Teams page", async () => {
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /^Teams$/i, level: 3 }),
    ).toBeInTheDocument();

    expect(screen.getByText("Team 1")).toBeInTheDocument();
    expect(screen.getByText("Test Team")).toBeInTheDocument();
  });

  it("handles fetch errors", async () => {
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    (useLiveQuery as Record<string, any>).mockImplementation(
      (cb: () => any) => {
        const code = cb.toString();
        if (code.includes("teams")) {
          cb().catch(() => {});
        }
        return [];
      },
    );

    (db.open as Record<string, any>).mockRejectedValue(
      new Error("Fetch Error"),
    );

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch teams:"),
        expect.any(Error),
      );
    });
  });


  it("adds a new team with fouls setting", async () => {
    (db.teams.add as any).mockResolvedValue({});
    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    // Open dialog
    fireEvent.click(screen.getByLabelText(/add new team/i));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Team Name/i), {
      target: { value: "New Team" },
    });
    fireEvent.change(screen.getByLabelText(/Fouls/i), {
      target: { value: "5" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));

    await waitFor(() => {
      expect(db.teams.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Team",
          fouls: 5,
        }),
      );
    });
  });

  it("handles error when adding team", async () => {
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    (db.teams.add as any).mockRejectedValue(new Error("Add team error"));

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));
    fireEvent.change(screen.getByLabelText(/Team Name/i), {
      target: { value: "Error Team" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add team"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
