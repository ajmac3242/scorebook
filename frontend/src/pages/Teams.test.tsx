import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Teams from "./Teams";
import * as useTeamsHook from "../hooks/useTeams";
import * as useTeamsDataHook from "./Teams/hooks/useTeamsData";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

vi.mock("../hooks/useTeams", () => ({
  useTeams: vi.fn(),
}));

vi.mock("./Teams/hooks/useTeamsData", () => ({
  useTeamsData: vi.fn(),
}));

// Mock components that might be problematic in unit tests
vi.mock("../components/layout/AppPageShell", () => ({
  default: ({
    children,
    title,
    controls,
  }: {
    children: React.ReactNode;
    title: string;
    controls: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      <div>{controls}</div>
      {children}
    </div>
  ),
}));

describe("Teams Page", () => {
  const mockTeams = [
    { id: "1", name: "Lakers", isFavorite: 1, primaryColor: "#552583" },
    { id: "2", name: "Celtics", isFavorite: 0, primaryColor: "#007A33" },
  ];

  beforeEach(() => {
    (useTeamsHook.useTeams as Mock).mockReturnValue(mockTeams);
    (useTeamsDataHook.useTeamsData as Mock).mockReturnValue({
      teamAggregatesMap: {},
      handleToggleFavorite: vi.fn(),
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <CourtSightThemeProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </CourtSightThemeProvider>,
    );
  };

  it("renders the Teams page with title", () => {
    renderWithProviders(<Teams />);
    expect(screen.getByText("Teams")).toBeInTheDocument();
  });

  it("filters teams based on search input", () => {
    renderWithProviders(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    fireEvent.change(searchInput, { target: { value: "Lakers" } });

    expect(screen.getByText("Lakers")).toBeInTheDocument();
    expect(screen.queryByText("Celtics")).not.toBeInTheDocument();
  });

  it("shows filter chips when filters are active", () => {
    renderWithProviders(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    fireEvent.change(searchInput, { target: { value: "Lakers" } });

    expect(screen.getByText("Search: Lakers")).toBeInTheDocument();
  });

  it("clears search when filter chip is deleted", () => {
    renderWithProviders(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    fireEvent.change(searchInput, { target: { value: "Lakers" } });

    // MUI Chip delete icon is usually a svg with data-testid="CancelIcon"
    // or we can find by role button if we can distinguish it.
    const deleteButton = screen.getByTestId("CancelIcon");
    fireEvent.click(deleteButton);

    expect(screen.getByText("Celtics")).toBeInTheDocument();
  });
});
