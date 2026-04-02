import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Settings from "../pages/Settings";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { AuthProvider } from "../context/AuthContext";
import React from "react";

// Mock the whole syncService
vi.mock("../utils/syncService", () => ({
  syncService: {
    hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
    subscribe: vi.fn(() => vi.fn()),
    getSyncingStatus: vi.fn().mockReturnValue(false),
  },
}));

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock db.delete
    (db.delete as any) = vi.fn().mockResolvedValue(undefined);
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <AuthProvider>
          <Settings />
        </AuthProvider>
      </BrowserRouter>,
    );

  it("renders Settings page and displays system status", async () => {
    renderComponent();

    expect(screen.getByText("Application Settings")).toBeInTheDocument();
    expect(screen.getByText("Network Connection")).toBeInTheDocument();
    expect(screen.getByText("Synchronization Status")).toBeInTheDocument();
  });

  it("handles logout without unsynced changes", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(false);
    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem("isAuthenticated")).toBeNull();
    });
  });

  it("shows warning dialog when logging out with unsynced changes", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(true);
    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutBtn);

    expect(await screen.findByText("Unsynced Changes")).toBeInTheDocument();
    expect(
      screen.getByText(/You have data that hasn't been synced/i),
    ).toBeInTheDocument();
  });

  it("clears IndexedDB and ETags on confirmed logout", async () => {
    vi.mocked(syncService.hasUnsyncedChanges).mockResolvedValue(true);
    localStorage.setItem("etag_team_1", "tag123");
    localStorage.setItem("other_key", "value");

    renderComponent();

    const logoutBtn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: /Logout Anyway/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(db.delete).toHaveBeenCalled();
      expect(localStorage.getItem("etag_team_1")).toBeNull();
      expect(localStorage.getItem("other_key")).toBe("value"); // Should NOT be removed
      expect(localStorage.getItem("isAuthenticated")).toBeNull();
    });
  });

  it("allows copying logs to clipboard", async () => {
    // Mock navigator.clipboard.writeText
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    // Add a mock log to ensure the copy button is not disabled
    import("../utils/logger").then(({ logger }) => {
      logger.info("Test log");
    });

    renderComponent();

    const copyBtn = await screen.findByRole("button", { name: /copy/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalled();
  });
});
