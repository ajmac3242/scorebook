import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "../pages/Settings";

const { mockClearLogs, mockSubscribe, mockGetLogs } = vi.hoisted(() => ({
  mockClearLogs: vi.fn(),
  mockSubscribe: vi.fn(() => vi.fn()),
  mockGetLogs: vi.fn(() => []),
}));

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

  it("renders settings page", async () => {
    render(<Settings />);

    expect(await screen.findByText(/settings/i)).toBeInTheDocument();
  });

  it("subscribes to logger updates", async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  it("loads logs from logger", async () => {
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

  it("clears logs when clear action is triggered", async () => {
    const user = userEvent.setup();

    render(<Settings />);

    const clearButton = await screen.findByRole("button", {
      name: /clear logs/i,
    });

    await user.click(clearButton);

    expect(mockClearLogs).toHaveBeenCalled();
  });
});
