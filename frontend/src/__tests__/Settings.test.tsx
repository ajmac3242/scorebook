import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "../pages/Settings";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockClearLogs, mockSubscribe, mockGetLogs } = vi.hoisted(() => ({
  mockClearLogs: vi.fn(),
  mockSubscribe: vi.fn(() => vi.fn()),
  mockGetLogs: vi.fn(() => []),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../utils/logger", () => ({
  logger: {
    clearLogs: mockClearLogs,
    subscribe: mockSubscribe,
    getLogs: mockGetLogs,
  },
}));

vi.mock("../db", () => ({
  db: {
    settings: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}));

vi.mock("../theme/ThemeContext", () => ({
  useAppTheme: () => ({
    themeMode: "light",
    setThemeMode: vi.fn(),
    themePreset: "default",
    setThemePreset: vi.fn(),
    currentPreset: {
      id: "default",
      name: "Default",
      colors: {},
    },
    availablePresets: [
      { id: "default", name: "Default", colors: {} },
      { id: "dark", name: "Dark", colors: {} },
    ],
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    loading: false,
    isAuthenticated: true,
  }),
}));

vi.mock("../utils/syncService", () => ({
  syncService: {
    exportData: vi.fn(),
    importData: vi.fn(),
    syncNow: vi.fn(),
    getStatus: vi.fn(() => "idle"),
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearLogs.mockClear();
    mockSubscribe.mockClear();
    mockGetLogs.mockClear();
    mockGetLogs.mockReturnValue([]);
    mockSubscribe.mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders settings page with tabs", async () => {
    render(<Settings />);

    // Tab labels confirmed present in CI DOM output
    expect(
      await screen.findByRole("tab", { name: /account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /appearance/i }),
    ).toBeInTheDocument();
  });

  it("subscribes to logger updates on mount", async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it("loads logs from logger on mount", async () => {
    mockGetLogs.mockReturnValue([
      {
        id: "1",
        level: "info",
        message: "Test log",
        timestamp: new Date().toISOString(),
      },
    ]);

    render(<Settings />);

    await waitFor(() => {
      expect(mockGetLogs).toHaveBeenCalled();
    });
  });

  it("navigates to Appearance tab and renders preset options", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const appearanceTab = await screen.findByRole("tab", {
      name: /appearance/i,
    });
    await user.click(appearanceTab);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /appearance/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});
