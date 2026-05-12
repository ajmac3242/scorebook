import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../pages/Settings";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { AuthProvider } from "../context/AuthContext";
import React from "react";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

// Mock the whole syncService
vi.mock("../utils/syncService", () => ({
  syncService: {
    hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
    subscribe: vi.fn(() => vi.fn()),
    getSyncingStatus: vi.fn().mockReturnValue(false),
  },
}));

const mockPresets = [
  {
    id: "default",
    label: "Default",
    previewColor: "#FF6B2B",
    mode: "dark" as const,
    palette: { primary: { main: "#FF6B2B" } },
  },
];

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (db.delete as any) = vi.fn().mockResolvedValue(undefined);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <CourtSightThemeProvider presets={mockPresets}>
          <AuthProvider>
            <Settings />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );

  it("renders Settings page and displays appearance settings", async () => {
    renderComponent();

    expect(screen.getAllByText(/appearance/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/color theme/i)).toBeInTheDocument();
    expect(screen.getByText(/theme presets/i)).toBeInTheDocument();
    expect(screen.getByText(/default/i)).toBeInTheDocument();
  });

  it.skip("handles logout without unsynced changes", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(false);
    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem("isAuthenticated")).toBeNull();
    });
  });

  it.skip("shows warning dialog when logging out with unsynced changes", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(true);
    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    fireEvent.click(logoutBtn);

    expect(await screen.findByText("Unsynced Changes")).toBeInTheDocument();
    expect(
      screen.getByText(/You have data that hasn't been synced/i),
    ).toBeInTheDocument();
  });

  it.skip("clears IndexedDB and ETags on confirmed logout", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(true);
    localStorage.setItem("etag_team_1", "tag123");
    localStorage.setItem("other_key", "value");

    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /log out/i });
    fireEvent.click(logoutBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: /log out anyway/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(db.delete).toHaveBeenCalled();
      expect(localStorage.getItem("etag_team_1")).toBeNull();
      expect(localStorage.getItem("other_key")).toBe("value");
      expect(localStorage.getItem("isAuthenticated")).toBeNull();
    });
  });

  it.skip("allows copying logs to clipboard", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    import("../utils/logger").then(({ logger }) => {
      logger.info("Test log");
    });

    renderComponent();

    const copyBtn = await screen.findByRole("button", { name: /copy/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalled();
  });
});
