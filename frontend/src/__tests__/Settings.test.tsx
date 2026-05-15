import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
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
    mockClearLogs.mockClear();
    mockSubscribe.mockClear();
    mockGetLogs.mockClear();
    mockGetLogs.mockReturnValue([]);
    mockSubscribe.mockImplementation(() => vi.fn());
  });

  it("renders settings page with all tabs", async () => {
    render(<Settings />);

    expect(await screen.findByRole("tab", { name: /account/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /security/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /appearance/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /billing/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /integrations/i })).toBeInTheDocument();
  });

  it("defaults to Appearance tab selected", async () => {
    render(<Settings />);

    const appearanceTab = await screen.findByRole("tab", { name: /appearance/i });
    expect(appearanceTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders appearance tab content by default", async () => {
    render(<Settings />);

    // Confirmed in CI DOM: this text is visible in the default Appearance tab panel
    expect(
      await screen.findByText(/Change how your public dashboard looks and feels/i)
    ).toBeInTheDocument();
  });

  it("can navigate to Account tab", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const accountTab = await screen.findByRole("tab", { name: /account/i });
    await user.click(accountTab);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /account/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });
});
