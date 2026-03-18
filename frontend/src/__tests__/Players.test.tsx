import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Players from "../pages/Players";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

describe("Players Component", () => {
  const mockPlayers = [
    { id: "1", name: "John Doe", defaultNumber: "23" },
  ];

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

    expect(screen.getByRole("heading", { name: /Players/i })).toBeInTheDocument();
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
    expect(screen.getByText(/Default Number: 23/i)).toBeInTheDocument();
  });

  it("adds a new player", async () => {
    (db.players.add as any).mockResolvedValue(1);

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));

    fireEvent.change(screen.getByLabelText(/Player Name/i), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText(/Default Number/i), { target: { value: "10" } });

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(db.players.add).toHaveBeenCalledWith(expect.objectContaining({
        name: "Jane Smith",
        defaultNumber: "10",
      }));
    });
  });

  it("handles fetch error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (useLiveQuery as any).mockImplementation((cb) => {
        cb().catch(() => {});
        return [];
    });
    (db.open as any).mockRejectedValue(new Error("Dexie error"));

    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch players:", expect.any(Error));
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
    fireEvent.change(screen.getByLabelText(/Player Name/i), { target: { value: "Error Player" } });
    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to add player:", expect.any(Error));
    });
  });
});
