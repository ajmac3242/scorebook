import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Settings from "../pages/Settings";

const mockLogout = vi.fn();
const mockSetPresetId = vi.fn();
const mockPushUpdates = vi.fn();
const mockPullAll = vi.fn();
const mockWriteText = vi.fn();

const mockAvailablePresets = [
  {
    id: "classic",
    label: "Classic",
    previewColor: "#287094",
    mode: "light" as const,
  },
  {
    id: "simplified",
    label: "Simplified",
    previewColor: "#D0D5DD",
    mode: "light" as const,
  },
  {
    id: "custom-css",
    label: "Custom CSS",
    previewColor: "#98A2B3",
    mode: "light" as const,
  },
];

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

vi.mock("../theme/ThemeContext", () => ({
  useAppTheme: () => ({
    presetId: "classic",
    setPresetId: mockSetPresetId,
    availablePresets: mockAvailablePresets,
  }),
}));

vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: () => ({
      getSession: (cb: (err: Error | null, session: unknown) => void) =>
        cb(null, {}),
      getUserAttributes: (
        cb: (
          err: Error | null,
          attrs: Array<{ getName: () => string; getValue: () => string }>
        ) => void
      ) =>
        cb(null, [
          {
            getName: () => "email",
            getValue: () => "test@example.com",
          },
        ]),
    }),
  },
}));

vi.mock("../db", () => ({
  db: {
    tables: [
      { name: "games", count: vi.fn().mockResolvedValue(5) },
      { name: "teams", count: vi.fn().mockResolvedValue(3) },
    ],
  },
}));

vi.mock("../utils/logger", () => ({
  logger: {
    getLogs: vi.fn(() => [
      {
        level: "info",
        timestamp: "2026-05-15T10:00:00Z",
        message: "Application started",
      },
      {
        level: "error",
        timestamp: "2026-05-15T10:01:00Z",
        message: "Sync failed once",
      },
    ]),
    clearLogs: vi.fn(),
  },
}));

vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: mockPushUpdates,
    pullAll: mockPullAll,
  },
}));

const renderSettings = () => {
  const theme = createTheme({
    palette: {
      mode: "light",
      primary: { main: "#287094" },
      background: {
        default: "#f8f9fb",
        paper: "#ffffff",
      },
    },
  });

  return render(
    <ThemeProvider theme={theme}>
      <Settings />
    </ThemeProvider>
  );
};

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "navigator", {
      value: {
        ...window.navigator,
        onLine: true,
        clipboard: {
          writeText: mockWriteText.mockResolvedValue(undefined),
        },
      },
      configurable: true,
    });
  });

  it("renders the settings shell and default appearance tab", async () => {
    renderSettings();

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Appearance" })).toBeInTheDocument();
    expect(
      screen.getByText("Change how your public dashboard looks and feels.")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("#444CE7")).toBeInTheDocument();
    });
  });

  it("renders restored theme presets in the appearance section", async () => {
    renderSettings();

    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.getByText("Simplified")).toBeInTheDocument();
    expect(screen.getByText("Custom CSS")).toBeInTheDocument();

    expect(screen.getByText("Default company branding.")).toBeInTheDocument();
    expect(screen.getByText("Minimal and modern.")).toBeInTheDocument();
    expect(screen.getByText("Manage styling with CSS.")).toBeInTheDocument();
  });

  it("changes the selected preset when a preset card is clicked", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByText("Simplified"));

    expect(mockSetPresetId).toHaveBeenCalledWith("simplified");
  });

  it("allows brand color editing", async () => {
    const user = userEvent.setup();
    renderSettings();

    const input = screen.getByDisplayValue("#444CE7");
    await user.clear(input);
    await user.type(input, "#123456");

    expect(screen.getByDisplayValue("#123456")).toBeInTheDocument();
  });

  it("allows language selection", async () => {
    const user = userEvent.setup();
    renderSettings();

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /English \(US\)/i }));

    expect(screen.getByText("🇺🇸 English (US)")).toBeInTheDocument();
  });

  it("switches to account tab and shows account content", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("tab", { name: "Account" }));

    expect(screen.getByText("Manage your session and account details.")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls logout when sign out is clicked", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("tab", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockLogout).toHaveBeenCalled();
  });

  it("renders placeholder content for profile-related tabs", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("tab", { name: "Profile" }));
    expect(
      screen.getByText(/Profile settings can now reuse the same shell/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Security" }));
    expect(
      screen.getByText(/Security settings can reuse this token-driven settings structure/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Notifications" }));
    expect(
      screen.getByText(/Notification settings can be added without inventing a new layout system/i)
    ).toBeInTheDocument();
  });

  it("renders billing and integrations placeholders", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("tab", { name: "Billing" }));
    expect(
      screen.getByText(/Billing settings can plug into the same settings shell/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Integrations" }));
    expect(
      screen.getByText(/Integration settings can share the same tokens and spacing model/i)
    ).toBeInTheDocument();
  });
});
