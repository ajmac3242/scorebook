import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EntityBanner from "../components/EntityBanner";
import { BrowserRouter } from "react-router-dom";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

describe("EntityBanner", () => {
  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <CourtSightThemeProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </CourtSightThemeProvider>,
    );
  };

  it("renders basic title and subtitle", () => {
    renderWithProviders(
      <EntityBanner title="Test Team" subtitle="Test Subtitle" />,
    );
    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("renders initials when no avatar or icon is provided", () => {
    renderWithProviders(<EntityBanner title="Golden State" />);
    expect(screen.getByText("GS")).toBeInTheDocument();
  });

  it("renders jersey number when provided", () => {
    renderWithProviders(<EntityBanner title="Player" jerseyNumber="30" />);
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("handles back button click", () => {
    renderWithProviders(<EntityBanner title="Test" backTo="/teams" />);
    fireEvent.click(screen.getByLabelText(/Back to teams/i));
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });

  it("renders stats correctly", () => {
    const stats = [
      { label: "PPG", value: "25.5" },
      { label: "RPG", value: 10 },
    ];
    renderWithProviders(<EntityBanner title="Test" stats={stats} />);
    expect(screen.getByText("PPG")).toBeInTheDocument();
    expect(screen.getByText("25.5")).toBeInTheDocument();
    expect(screen.getByText("RPG")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("handles search expansion and input", async () => {
    const onSearchChange = vi.fn();
    renderWithProviders(
      <EntityBanner
        title="Test"
        onSearchChange={onSearchChange}
        searchTerm=""
      />,
    );

    const searchButton = screen.getByLabelText("search");
    fireEvent.click(searchButton);

    const searchField = screen.getByPlaceholderText(/Search.../i);
    fireEvent.change(searchField, { target: { value: "query" } });
    expect(onSearchChange).toHaveBeenCalledWith("query");

    // Close search
    fireEvent.click(screen.getByLabelText("close search"));
    expect(screen.queryByPlaceholderText(/Search.../i)).not.toBeInTheDocument();
  });

  it("handles sync click", () => {
    const onSync = vi.fn();
    renderWithProviders(<EntityBanner title="Test" onSync={onSync} />);

    const syncButton = screen.getByRole("button", { name: /Sync/i });
    fireEvent.click(syncButton);
    expect(onSync).toHaveBeenCalled();
    expect(screen.getByText("Synced")).toBeInTheDocument();
  });
});
