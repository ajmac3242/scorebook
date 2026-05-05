import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { describe, it, expect, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import React from "react";

const theme = createTheme();

describe("Dashboard Component", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it("renders Dashboard page and empty state", () => {
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText(/Notebook Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to Scorebook!/i)).toBeInTheDocument();
  });

  it("renders dashboard for favorite team", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockDb.seed({
      teams: [{ id: "t1", name: "Lakers", isFavorite: 1 }],
      games: [
        {
          id: "g1",
          teamId: "t1",
          opponent: "Celtics",
          completed: true,
          date: "2024-01-01",
        },
        {
          id: "g2",
          teamId: "t1",
          opponent: "Warriors",
          completed: false,
          date: today,
        },
      ],
      stats: [
        { id: "s1", gameId: "g1", type: "MAKE", points: 2, playerId: "p1" },
      ],
    });

    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByText("Lakers")).toBeInTheDocument();
    expect(screen.getByText(/Team Aggregates/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Celtics/i)).toBeInTheDocument();
    expect(screen.getByText(/vs Warriors/i)).toBeInTheDocument();
  });
});
