import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Players from "../pages/Players";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

describe("Players Component", () => {
  const mockPlayers = [{ id: "1", name: "John Doe", avatarColor: "#4E7D5B" }];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockReturnValue([]);
  });

  it("renders Players page and empty state", async () => {
    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Roster Notebook/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No players created yet/i)).toBeInTheDocument();
  });

  it("renders list of players", async () => {
    (useLiveQuery as any).mockReturnValue(mockPlayers);

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("adds a new player", async () => {
    (db.players.add as any).mockResolvedValue(1);

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));

    fireEvent.change(screen.getByLabelText(/Player Name/i), {
      target: { value: "Jane Smith" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(db.players.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Jane Smith",
        }),
      );
    });
  });

  it("handles fetch error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (useLiveQuery as any).mockImplementation((cb) => {
      const res = cb();
      if (res && res.catch) res.catch(() => {});
      return [];
    });
    (db.open as any).mockRejectedValue(new Error("Dexie error"));

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch players:",
        expect.any(Error),
      );
    });
  });

  it("handles error when adding player", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (db.players.add as any).mockRejectedValue(new Error("Add error"));

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));
    fireEvent.change(screen.getByLabelText(/Player Name/i), {
      target: { value: "Error Player" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add player"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
