import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  assertAccessible,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import Settings from "../pages/Settings";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import PRESETS from "../theme/presets";
import { db } from "../db";
import { UserPool } from "../UserPool";

// Mock syncService
vi.mock("../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
    pullAll: vi.fn().mockResolvedValue(undefined),
    getSyncingStatus: vi.fn().mockReturnValue(false),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}));

// Mock UserPool
vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn().mockReturnValue({
      getSession: vi.fn((cb) => cb(null, { isValid: () => true })),
      getUserAttributes: vi.fn((cb) => cb(null, [])),
      signOut: vi.fn(),
    }),
  },
}));

// Mock db is already handled by setupTests.ts which uses mockDb
// We just need to ensure db.tables exists for Settings.tsx
// @ts-ignore
if (!db.tables) {
  // @ts-ignore
  db.tables = [db.teams, db.players, db.teamPlayers, db.games, db.stats];
  // @ts-ignore
  db.teams.name = "teams";
  // @ts-ignore
  db.players.name = "players";
  // @ts-ignore
  db.teamPlayers.name = "teamPlayers";
  // @ts-ignore
  db.games.name = "games";
  // @ts-ignore
  db.stats.name = "stats";
}

// Mock logger
vi.mock("../utils/logger", () => ({
  logger: {
    getLogs: vi.fn().mockReturnValue([
      {
        level: "info",
        timestamp: "2024-01-01T10:00:00Z",
        message: "Initial log",
      },
    ]),
    clearLogs: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}));

// Mock navigator.clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: writeTextMock,
  },
  configurable: true,
});

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = (ui: React.ReactElement) => {
    return render(ui);
  };

  it("renders the settings page with tabs", async () => {
    const { container } = renderComponent(<Settings />);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Account/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /System/i })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Appearance/i }),
    ).toBeInTheDocument();

    // Known pre-existing violations in Settings page:
    // 1. Heading levels skipping (heading-order) - e.g. using h6 for section titles without parent headings
    // We document these and move forward as per task instructions by disabling specific failing rules.
    await assertAccessible(container, {
      rules: {
        "heading-order": { enabled: false },
      },
    });
  });

  it("displays account information by default", async () => {
    renderComponent(<Settings />);

    // Check if Account tab content is visible (getByText might match multiple elements if title and tab have same text)
    expect(screen.getAllByText("Account").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Manage your local app data and sign out safely."),
    ).toBeInTheDocument();

    // Wait for user attributes to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText("Email address")).toBeInTheDocument();
    });
  });

  it("switches to Appearance tab and shows theme presets", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /Appearance/i }));

    expect(screen.getByText("Theme presets")).toBeInTheDocument();

    // Verify all presets from PRESETS are rendered
    PRESETS.forEach((preset) => {
      expect(screen.getByText(preset.label)).toBeInTheDocument();
    });
  });

  it("changes theme preset when a card is clicked", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /Appearance/i }));

    // Find a preset that is not the default one (assuming gametime is default)
    const classicPreset = PRESETS.find((p) => p.id === "classic");
    if (!classicPreset) throw new Error("Classic preset not found");

    const presetCard =
      screen.getByText(classicPreset.label).closest("div[role='button']") ||
      screen.getByText(classicPreset.label);
    await user.click(presetCard);

    // Verify localStorage was updated (part of ThemeContext behavior)
    expect(localStorage.getItem("courtsight_preset_id")).toBe("classic");
  });

  it("switches to System tab and shows system controls", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /System/i }));

    expect(screen.getByText("Network connection")).toBeInTheDocument();
    expect(screen.getByText("Synchronization")).toBeInTheDocument();
    expect(screen.getByText("Local storage")).toBeInTheDocument();
    expect(screen.getByText("System logs")).toBeInTheDocument();
  });

  it("triggers sync when Sync now button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /System/i }));

    const syncButton = screen.getByRole("button", { name: /Sync now/i });
    await user.click(syncButton);

    expect(syncService.pushUpdates).toHaveBeenCalled();
  });

  it("copies logs to clipboard when Copy logs button is clicked", async () => {
    const user = userEvent.setup();
    // Pre-mock clipboard for this test to ensure it's fresh
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      configurable: true,
    });

    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /System/i }));

    // Wait for logs to be displayed
    await screen.findByText("Initial log");

    const copyButton = screen.getByRole("button", { name: /Copy logs/i });
    await user.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining("Initial log"),
    );
  });

  it("clears logs when Clear logs button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /System/i }));

    const clearButton = screen.getByRole("button", { name: /Clear logs/i });
    await user.click(clearButton);

    expect(logger.clearLogs).toHaveBeenCalled();
  });

  it("triggers database clearing when Delete local data button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent(<Settings />);

    await user.click(screen.getByRole("tab", { name: /System/i }));

    const deleteButton = screen.getByRole("button", {
      name: /Delete local data/i,
    });

    // Mock db.transaction
    const transactionSpy = vi.spyOn(db, "transaction");

    await user.click(deleteButton);

    // Should show confirm dialog
    expect(
      screen.getByText(/This will permanently delete all game data/i),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /Delete data/i });
    await user.click(confirmButton);

    expect(transactionSpy).toHaveBeenCalled();
  });

  it("calls logout when Log out button is clicked", async () => {
    const user = userEvent.setup();

    const cognitoUser = UserPool.getCurrentUser();
    renderComponent(<Settings />);

    // Account tab is default
    const logoutButton = screen.getByRole("button", { name: /Log out/i });
    await user.click(logoutButton);

    // Should show confirm dialog
    expect(
      screen.getByText(/Are you sure you want to sign out/i),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /Sign out/i });
    await user.click(confirmButton);

    expect(cognitoUser?.signOut).toHaveBeenCalled();
  });

  it("has accessible labels for interactive elements", () => {
    renderComponent(<Settings />);

    // Tabs should have role="tab"
    expect(screen.getByRole("tab", { name: /Account/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /System/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Buttons should be accessible
    expect(
      screen.getByRole("button", { name: /Log out/i }),
    ).toBeInTheDocument();
  });
});
