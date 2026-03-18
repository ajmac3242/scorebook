import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Seasons from "../pages/Seasons";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

describe("Seasons Component", () => {
  const mockSeasons = [
    { id: "1", name: "Spring 2024", startDate: "2024-03-01", endDate: "2024-05-31" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useLiveQuery as any).mockReturnValue([]);
  });

  it("renders Seasons page and empty state", async () => {
    render(
      <BrowserRouter>
        <Seasons />
      </BrowserRouter>,
    );

    expect(screen.getByRole("heading", { name: /Seasons/i })).toBeInTheDocument();
    expect(screen.getByText(/No seasons created yet/i)).toBeInTheDocument();
  });

  it("renders list of seasons", async () => {
    (useLiveQuery as any).mockReturnValue(mockSeasons);

    render(
      <BrowserRouter>
        <Seasons />
      </BrowserRouter>,
    );

    expect(screen.getByText("Spring 2024")).toBeInTheDocument();
    expect(screen.getByText(/2024-03-01 to 2024-05-31/i)).toBeInTheDocument();
  });

  it("adds a new season", async () => {
    (db.seasons.add as any).mockResolvedValue(1);

    render(
      <BrowserRouter>
        <Seasons />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));

    fireEvent.change(screen.getByLabelText(/Season Name/i), { target: { value: "Summer 2024" } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: "2024-06-01" } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: "2024-08-31" } });

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(db.seasons.add).toHaveBeenCalledWith(expect.objectContaining({
        name: "Summer 2024",
        startDate: "2024-06-01",
        endDate: "2024-08-31",
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
        <Seasons />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch seasons:", expect.any(Error));
    });
  });

  it("handles error when adding season", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (db.seasons.add as any).mockRejectedValue(new Error("Add error"));

    render(
      <BrowserRouter>
        <Seasons />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByLabelText(/add/i));
    fireEvent.change(screen.getByLabelText(/Season Name/i), { target: { value: "Error Season" } });
    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to add season:", expect.any(Error));
    });
  });
});
