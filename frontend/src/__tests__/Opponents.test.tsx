import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Opponents from "../pages/Opponents";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { syncService } from "../utils/syncService";

// Mock the database
vi.mock("../db", () => ({
  db: {
    opponents: {
      toArray: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock sync service
vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn(),
  },
}));

// Mock crypto.randomUUID
if (typeof window !== "undefined" && !window.crypto?.randomUUID) {
  Object.defineProperty(window.crypto, "randomUUID", {
    value: vi.fn().mockReturnValue("test-uuid"),
    configurable: true,
  });
}

describe("Opponents Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'No opponents' state when empty", async () => {
    (db.opponents.toArray as any).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Opponents />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No opponents tracked yet/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Add Your First Opponent/i }),
    ).toBeInTheDocument();
  });

  it("renders a list of opponents", async () => {
    const mockOpponents = [
      { id: "1", name: "Lakers", logoUrl: "", roster: [1, 2, 3] },
      { id: "2", name: "Celtics", logoUrl: "", roster: [] },
    ];
    (db.opponents.toArray as any).mockResolvedValue(mockOpponents);

    render(
      <BrowserRouter>
        <Opponents />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Lakers")).toBeInTheDocument();
      expect(screen.getByText("Celtics")).toBeInTheDocument();
    });

    expect(screen.getByText("3 players identified")).toBeInTheDocument();
  });

  it("opens add dialog and adds a new opponent", async () => {
    (db.opponents.toArray as any).mockResolvedValue([]);
    (db.opponents.add as any).mockResolvedValue("test-uuid");

    render(
      <BrowserRouter>
        <Opponents />
      </BrowserRouter>,
    );

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: /Add Opponent/i }));
    expect(screen.getByText("Add New Opponent")).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/Opponent Name/i), {
      target: { value: "Warriors" },
    });
    fireEvent.change(screen.getByLabelText(/Logo URL/i), {
      target: { value: "http://logo.png" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(db.opponents.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Warriors",
          logoUrl: "http://logo.png",
        }),
      );
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("opens delete confirmation and deletes an opponent", async () => {
    const mockOpponents = [{ id: "1", name: "Lakers", roster: [] }];
    (db.opponents.toArray as any).mockResolvedValue(mockOpponents);

    render(
      <BrowserRouter>
        <Opponents />
      </BrowserRouter>,
    );

    await waitFor(() => screen.getByText("Lakers"));

    // Click delete button on the Lakers card
    fireEvent.click(screen.getByLabelText(/Delete Opponent/i));

    // Check dialog content
    expect(
      screen.getByText(/Are you sure you want to delete/i),
    ).toBeInTheDocument();
    // Lakers name appears in the list and in the dialog. Use getAllByText or specific selector.
    expect(screen.getAllByText("Lakers").length).toBeGreaterThan(1);

    // Confirm deletion
    fireEvent.click(screen.getByRole("button", { name: "Delete Opponent" }));

    await waitFor(() => {
      expect(db.opponents.delete).toHaveBeenCalledWith("1");
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });
});
