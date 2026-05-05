import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Players from "../pages/Players";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();
const mockDb = (globalThis as any).mockDb;

describe("Players Component", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Players />
        </BrowserRouter>
      </ThemeProvider>,
    );

  it("renders Players page and empty state", async () => {
    renderComponent();
    expect(
      await screen.findByRole("heading", { name: /^Players$/i, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No active players found/i)).toBeInTheDocument();
  });

  it("renders list of players", async () => {
    mockDb.seed({
      players: [
        { id: "p1", name: "John Doe", avatarColor: "red" },
        { id: "p2", name: "Jane Smith", avatarColor: "blue" },
      ],
    });

    renderComponent();
    expect(await screen.findByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it("adds a new player", async () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText(/add new player/i));

    const nameInput = screen.getByLabelText(/Player Name/i);
    fireEvent.change(nameInput, { target: { value: "New Player" } });

    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));

    await waitFor(() => {
      expect(mockDb.players.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Player",
        }),
      );
    });
  });

  it("handles fetch error", async () => {
    vi.spyOn(mockDb.players, "toArray").mockImplementation(() => {
      throw new Error("Fetch failed");
    });

    renderComponent();
    expect(
      await screen.findByRole("heading", { name: /^Players$/i, level: 3 }),
    ).toBeInTheDocument();
  });

  it("handles error when adding player", async () => {
    const logger = await import("../utils/logger");
    const loggerSpy = vi
      .spyOn(logger.logger, "error")
      .mockImplementation(() => {});

    renderComponent();

    vi.spyOn(mockDb.players, "add").mockImplementation(() => {
      throw new Error("Add failed");
    });

    fireEvent.click(screen.getByLabelText(/add new player/i));
    fireEvent.change(screen.getByLabelText(/Player Name/i), {
      target: { value: "Fail Player" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Player/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add player"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
