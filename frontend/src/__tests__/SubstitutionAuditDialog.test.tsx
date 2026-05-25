import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SubstitutionAuditDialog from "../components/SubstitutionAuditDialog";
import { db } from "../db";

// Mock the database
vi.mock("../db", () => ({
  db: {
    stats: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
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

describe("SubstitutionAuditDialog", () => {
  const mockGameId = "game-123";
  const mockPlayers = [
    { id: "p1", name: "Player One", avatarColor: "blue" },
    { id: "p2", name: "Player Two", avatarColor: "red" },
  ];
  const mockJerseyMap = new Map([
    ["p1", "10"],
    ["p2", "20"],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    (db.stats.toArray as any).mockResolvedValue([
      {
        id: "s1",
        type: "SUB_IN",
        playerId: "p1",
        period: 1,
        clockTime: 600,
        timestamp: 1000,
        gameId: mockGameId,
      },
      {
        id: "s2",
        type: "SUB_OUT",
        playerId: "p2",
        period: 1,
        clockTime: 600,
        timestamp: 1001,
        gameId: mockGameId,
      },
    ]);
  });

  it("renders the substitution timeline", async () => {
    render(
      <SubstitutionAuditDialog
        open={true}
        onClose={vi.fn()}
        gameId={mockGameId}
        players={mockPlayers}
        jerseyMap={mockJerseyMap}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("IN")).toBeInTheDocument();
      expect(screen.getByText("OUT")).toBeInTheDocument();
      expect(screen.getByText("Player One")).toBeInTheDocument();
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });
  });

  it("handles starting and canceling an edit", async () => {
    render(
      <SubstitutionAuditDialog
        open={true}
        onClose={vi.fn()}
        gameId={mockGameId}
        players={mockPlayers}
        jerseyMap={mockJerseyMap}
      />
    );

    await waitFor(() => screen.getByLabelText(/Edit sub in for Player One/i));
    const editButton = screen.getByLabelText(/Edit sub in for Player One/i);

    await act(async () => {
      fireEvent.click(editButton);
    });

    expect(screen.getByDisplayValue("10:00")).toBeInTheDocument();

    const cancelButton = screen.getByLabelText(/Cancel editing/i);
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(screen.queryByLabelText(/Cancel editing/i)).not.toBeInTheDocument();
  });

  it("handles deleting a substitution event", async () => {
    (db.stats.update as any).mockResolvedValue(1);

    render(
      <SubstitutionAuditDialog
        open={true}
        onClose={vi.fn()}
        gameId={mockGameId}
        players={mockPlayers}
        jerseyMap={mockJerseyMap}
      />
    );

    await waitFor(() => screen.getByLabelText(/Delete sub in for Player One/i));
    const deleteButton = screen.getByLabelText(/Delete sub in for Player One/i);

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(screen.getByText(/Delete Substitution Event\?/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /Delete Event/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(db.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      deletedAt: expect.any(String),
    }));
  });

  it("handles saving an edit", async () => {
    (db.stats.update as any).mockResolvedValue(1);

    render(
      <SubstitutionAuditDialog
        open={true}
        onClose={vi.fn()}
        gameId={mockGameId}
        players={mockPlayers}
        jerseyMap={mockJerseyMap}
      />
    );

    await waitFor(() => screen.getByLabelText(/Edit sub in for Player One/i));
    const editButton = screen.getByLabelText(/Edit sub in for Player One/i);

    await act(async () => {
      fireEvent.click(editButton);
    });

    const timeInput = screen.getByDisplayValue("10:00");
    fireEvent.change(timeInput, { target: { value: "09:30" } });

    const saveButton = screen.getByLabelText(/Save changes/i);
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(db.stats.update).toHaveBeenCalledWith("s1", expect.objectContaining({
      clockTime: 570,
    }));
  });

  it("filters events by player", async () => {
    render(
      <SubstitutionAuditDialog
        open={true}
        onClose={vi.fn()}
        gameId={mockGameId}
        players={mockPlayers}
        jerseyMap={mockJerseyMap}
      />
    );

    await waitFor(() => screen.getByText("Player One"));

    const filterSelect = screen.getByLabelText(/Filter events by player/i);
    fireEvent.mouseDown(filterSelect);

    const playerOption = screen.getByRole("option", { name: /Player One/i });
    fireEvent.click(playerOption);

    expect(screen.getByText("Player One")).toBeInTheDocument();
    expect(screen.queryByText("Player Two")).not.toBeInTheDocument();
  });
});
