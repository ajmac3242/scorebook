import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../pages/Settings";
import { BrowserRouter } from "react-router-dom";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { AuthProvider } from "../context/AuthContext";

// Mock the database
vi.mock("../db", () => ({
  db: {
    tables: [],
    transaction: vi.fn(),
  },
}));

// Mock UserPool
vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn().mockReturnValue(null),
  },
}));

describe("Settings Page", () => {
  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <CourtSightThemeProvider>
        <AuthProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
      </CourtSightThemeProvider>,
    );
  };

  it("renders the settings page with tabs", () => {
    renderWithProviders(<Settings />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Account/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /System/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Appearance/i }),
    ).toBeInTheDocument();
  });

  it("switches to Appearance tab and shows theme presets", async () => {
    renderWithProviders(<Settings />);

    fireEvent.click(screen.getByRole("tab", { name: /Appearance/i }));

    expect(screen.getByText("Theme presets")).toBeInTheDocument();
    expect(screen.getAllByText(/Classic/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gametime/i).length).toBeGreaterThan(0);
  });

  it("switches to System tab and shows status", async () => {
    renderWithProviders(<Settings />);

    fireEvent.click(screen.getByRole("tab", { name: /System/i }));

    expect(screen.getByText("Network connection")).toBeInTheDocument();
    expect(screen.getByText("Synchronization")).toBeInTheDocument();
  });
});
