import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";
import {
  QuickEditRosterDialog,
  isValidJerseyNumber,
} from "./QuickEditRosterDialog";
import { db, Player, TeamPlayer } from "../../../db";

// Mock Dexie db methods
vi.mock("../../../db", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      players: {
        add: vi.fn(),
        update: vi.fn(),
      },
      teamPlayers: {
        add: vi.fn(),
        update: vi.fn(),
        where: vi.fn(),
      },
    },
  };
});

describe("isValidJerseyNumber", () => {
  it("validates standard jersey numbers correctly", () => {
    expect(isValidJerseyNumber("00")).toBe(true);
    expect(isValidJerseyNumber("0")).toBe(true);
    expect(isValidJerseyNumber("23")).toBe(true);
    expect(isValidJerseyNumber("99")).toBe(true);

    expect(isValidJerseyNumber("100")).toBe(false);
    expect(isValidJerseyNumber("-1")).toBe(false);
    expect(isValidJerseyNumber("abc")).toBe(false);
    expect(isValidJerseyNumber("3.14")).toBe(false);
    expect(isValidJerseyNumber("")).toBe(false);
  });
});

describe("QuickEditRosterDialog", () => {
  const mockTeamId = "team1";
  const mockPlayers: Player[] = [
    { id: "p1", name: "Jordan Sparks" },
    { id: "p2", name: "Marcus Smart" },
  ];
  const mockTeamPlayers: TeamPlayer[] = [
    {
      id: "tp1",
      teamId: "team1",
      playerId: "p1",
      jerseyNumber: "23",
      name: "Jordan Sparks",
    },
    {
      id: "tp2",
      teamId: "team1",
      playerId: "p2",
      jerseyNumber: "36",
      name: "Marcus Smart",
    },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    teamId: mockTeamId,
    players: mockPlayers,
    teamPlayers: mockTeamPlayers,
    onSaveSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders active roster player rows with prefilled values", () => {
    renderWithProviders(<QuickEditRosterDialog {...defaultProps} />, {
      withAuth: false,
    });

    expect(screen.getByText("Quick Edit Roster")).toBeInTheDocument();
    expect(screen.getByDisplayValue("23")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jordan Sparks")).toBeInTheDocument();
    expect(screen.getByDisplayValue("36")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Marcus Smart")).toBeInTheDocument();
  });

  it("validates against duplicate jersey numbers on save", async () => {
    renderWithProviders(<QuickEditRosterDialog {...defaultProps} />, {
      withAuth: false,
    });

    // Change Marcus Smart's jersey number to "23" (duplicate)
    const marcusJerseyInput = screen.getByDisplayValue("36");
    fireEvent.change(marcusJerseyInput, { target: { value: "23" } });

    const saveButton = screen.getByRole("button", { name: "Save Roster" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Duplicate jersey number "23" detected/i),
      ).toBeInTheDocument();
    });

    expect(db.players.update).not.toHaveBeenCalled();
  });

  it("validates against duplicate case-insensitive player names on save", async () => {
    renderWithProviders(<QuickEditRosterDialog {...defaultProps} />, {
      withAuth: false,
    });

    // Change Marcus Smart's name to "jordan sparks" (duplicate case-insensitive)
    const marcusNameInput = screen.getByDisplayValue("Marcus Smart");
    fireEvent.change(marcusNameInput, { target: { value: "jordan sparks" } });

    const saveButton = screen.getByRole("button", { name: "Save Roster" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Duplicate player name "jordan sparks" detected/i),
      ).toBeInTheDocument();
    });

    expect(db.players.update).not.toHaveBeenCalled();
  });

  it("validates invalid jersey format", async () => {
    renderWithProviders(<QuickEditRosterDialog {...defaultProps} />, {
      withAuth: false,
    });

    const jerseyInput = screen.getByDisplayValue("23");
    fireEvent.change(jerseyInput, { target: { value: "ABC" } });

    const saveButton = screen.getByRole("button", { name: "Save Roster" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Jersey number "ABC" for "Jordan Sparks" is invalid/i),
      ).toBeInTheDocument();
    });
  });

  it("allows adding a new late player and persists both new and updated records", async () => {
    vi.mocked(db.players.add).mockResolvedValue("p3" as any);
    vi.mocked(db.teamPlayers.add).mockResolvedValue("tp3" as any);
    vi.mocked(db.players.update).mockResolvedValue(1 as any);
    vi.mocked(db.teamPlayers.update).mockResolvedValue(1 as any);

    renderWithProviders(<QuickEditRosterDialog {...defaultProps} />, {
      withAuth: false,
    });

    // 1. Edit existing player name
    const jordanNameInput = screen.getByDisplayValue("Jordan Sparks");
    fireEvent.change(jordanNameInput, {
      target: { value: "Jordan Sparks Jr." },
    });

    // 2. Add late player row
    const addButton = screen.getByRole("button", { name: "Add Late Player" });
    fireEvent.click(addButton);

    const jerseyInputs = screen.getAllByLabelText(/Jersey number for player/i);
    const nameInputs = screen.getAllByLabelText(/Player name for player/i);

    expect(jerseyInputs).toHaveLength(3);
    expect(nameInputs).toHaveLength(3);

    // Fill in new player info
    fireEvent.change(jerseyInputs[2], { target: { value: "11" } });
    fireEvent.change(nameInputs[2], { target: { value: "Kobe Bryant" } });

    // Save
    const saveButton = screen.getByRole("button", { name: "Save Roster" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(db.players.update).toHaveBeenCalledWith("p1", {
        name: "Jordan Sparks Jr.",
        synced: 0,
      });
      expect(db.teamPlayers.update).toHaveBeenCalledWith("tp1", {
        name: "Jordan Sparks Jr.",
        jerseyNumber: "23",
        synced: 0,
      });
      expect(db.players.add).toHaveBeenCalledWith({
        name: "Kobe Bryant",
        synced: 0,
      });
      expect(db.teamPlayers.add).toHaveBeenCalledWith({
        teamId: "team1",
        playerId: "p3",
        name: "Kobe Bryant",
        jerseyNumber: "11",
        synced: 0,
      });
      expect(defaultProps.onSaveSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
