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

  it("shows inline clear search control when search is active", () => {
    renderWithProviders(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams");
    fireEvent.change(searchInput, { target: { value: "Lakers" } });

    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
    expect(screen.queryByText("Search: Lakers")).not.toBeInTheDocument();
  });

  it("clears search from the inline clear control", () => {
    renderWithProviders(<Teams />);

    const searchInput = screen.getByPlaceholderText("Search teams") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "Lakers" } });

    fireEvent.click(screen.getByLabelText("Clear search"));

    expect(searchInput.value).toBe("");
    expect(screen.getByText("Celtics")).toBeInTheDocument();
  });
});
