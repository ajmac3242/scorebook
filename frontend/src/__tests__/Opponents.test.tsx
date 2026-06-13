import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders as render, screen, waitFor } from "../test-utils";
import Opponents from "../pages/Opponents";
import { db } from "../db";
import { syncService } from "../utils/syncService";

// Mock the database
vi.mock("../db", () => ({
  db: {
    opponents: {
      toArray: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
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

const renderComponent = () => render(<Opponents />);

describe("Opponents Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'No opponents' state when empty", async () => {
    (db.opponents.toArray as any).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No active opponents/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Add first opponent/i }),
    ).toBeInTheDocument();
  });

  it("renders a list of opponents", async () => {
    const mockOpponents = [
      { id: "1", name: "Lakers", logoUrl: "", roster: [1, 2, 3] },
      { id: "2", name: "Celtics", logoUrl: "", roster: [] },
    ];
    (db.opponents.toArray as any).mockResolvedValue(mockOpponents);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Lakers")).toBeInTheDocument();
      expect(screen.getByText("Celtics")).toBeInTheDocument();
    });

    expect(screen.getByText("3 players identified")).toBeInTheDocument();
  });

  it("opens add dialog and adds a new opponent", async () => {
    (db.opponents.toArray as any).mockResolvedValue([]);
    (db.opponents.add as any).mockResolvedValue("test-uuid");

    const { user } = renderComponent();

    // Open dialog
    await user.click(screen.getByRole("button", { name: /Add Opponent/i }));
    expect(screen.getByText("Add New Opponent")).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/Opponent Name/i), "Warriors");
    await user.type(screen.getByLabelText(/Logo URL/i), "http://logo.png");

    // Submit
    await user.click(screen.getByRole("button", { name: "Add" }));

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

  it("opens delete confirmation and deletes an archived opponent", async () => {
    const mockOpponents = [
      { id: "1", name: "Lakers", roster: [], isArchived: 1 },
    ];
    (db.opponents.toArray as any).mockResolvedValue(mockOpponents);

    const { user } = renderComponent();

    await user.click(screen.getByRole("tab", { name: /Archived/i }));

    await waitFor(() => screen.getByText("Lakers"));

    await user.click(screen.getByLabelText(/Delete opponent Lakers/i));

    expect(
      screen.getByText(/Are you sure you want to delete/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Lakers").length).toBeGreaterThan(1);

    await user.click(screen.getByRole("button", { name: "Delete Opponent" }));

    await waitFor(() => {
      expect(db.opponents.delete).toHaveBeenCalledWith("1");
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });
});
