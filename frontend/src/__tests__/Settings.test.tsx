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
import { db } from "../db";
import { UserPool } from "../UserPool";
import React from "react";

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

// @ts-ignore
if (!db.tables) {
  // @ts-ignore
  db.tables = [db.teams, db.players, db.teamPlayers, db.games, db.stats, db.opponents];
  db.tables.forEach(t => {
    // @ts-ignore
    t.name = t.name || "mockTable";
  });
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

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the settings page with tabs", async () => {
    const { container } = render(<Settings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    await assertAccessible(container, {
      rules: { "heading-order": { enabled: false } },
    });
  });

  it("triggers database clearing", async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole("tab", { name: /System/i }));
    const deleteButton = screen.getByRole("button", { name: /Delete local data/i });
    const transactionSpy = vi.spyOn(db, "transaction");
    await user.click(deleteButton);
    await user.click(screen.getByRole("button", { name: /Delete Data/i }));
    expect(transactionSpy).toHaveBeenCalled();
  });

  it("calls logout", async () => {
    const user = userEvent.setup();
    const cognitoUser = UserPool.getCurrentUser();
    render(<Settings />);
    await user.click(screen.getByRole("button", { name: /Log out/i }));
    await user.click(screen.getByRole("button", { name: /^Log out$/i }));
    expect(cognitoUser?.signOut).toHaveBeenCalled();
  });

  it("copies logs", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextSpy,
      },
      configurable: true,
    });
    render(<Settings />);
    await user.click(screen.getByRole("tab", { name: /System/i }));
    await user.click(screen.getByRole("button", { name: /Copy logs/i }));
    expect(writeTextSpy).toHaveBeenCalled();
  });

  it("clears logs", async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole("tab", { name: /System/i }));
    await user.click(screen.getByRole("button", { name: /Clear logs/i }));
    expect(logger.clearLogs).toHaveBeenCalled();
  });
});
