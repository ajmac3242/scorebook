import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, act } from "@testing-library/react";
import { renderWithProviders, assertAccessible } from "../../test-utils";
import Navigation from "./Navigation";
import { syncService } from "../../utils/syncService";

vi.mock("../../utils/syncService", () => {
  let statusListener: ((status: boolean) => void) | null = null;
  return {
    syncService: {
      subscribe: vi.fn((cb: (status: boolean) => void) => {
        statusListener = cb;
        return () => {
          statusListener = null;
        };
      }),
      pushUpdates: vi.fn().mockResolvedValue(undefined),
      pullAll: vi.fn().mockResolvedValue(undefined),
      triggerStatusChange: (status: boolean) => {
        if (statusListener) statusListener(status);
      },
    },
  };
});

describe("Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders brand title and all main navigation items", () => {
    renderWithProviders(<Navigation />, { route: "/" });

    expect(screen.getByText("CourtSight")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Navigate to Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Navigate to Teams/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Navigate to Opponents/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Navigate to Players/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Navigate to Settings/i })).toBeInTheDocument();
  });

  it("marks the active route item with aria-current='page'", () => {
    renderWithProviders(<Navigation />, { route: "/teams" });

    const teamsLink = screen.getByRole("link", { name: /Navigate to Teams/i });
    expect(teamsLink).toHaveAttribute("aria-current", "page");

    const dashboardLink = screen.getByRole("link", { name: /Navigate to Dashboard/i });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("shows syncing status banner when syncService emits syncing state", () => {
    renderWithProviders(<Navigation />, { route: "/" });

    expect(screen.queryByRole("status", { name: /Synchronizing data with the server/i })).not.toBeInTheDocument();

    act(() => {
      (syncService as unknown as { triggerStatusChange: (status: boolean) => void }).triggerStatusChange(true);
    });

    expect(screen.getByRole("status", { name: /Synchronizing data with the server/i })).toBeInTheDocument();
    expect(screen.getByText("SYNCING DATA")).toBeInTheDocument();

    act(() => {
      (syncService as unknown as { triggerStatusChange: (status: boolean) => void }).triggerStatusChange(false);
    });

    expect(screen.queryByRole("status", { name: /Synchronizing data with the server/i })).not.toBeInTheDocument();
  });

  it("triggers sync update and pull when browser fires online event", async () => {
    renderWithProviders(<Navigation />, { route: "/" });

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(syncService.pushUpdates).toHaveBeenCalledTimes(1);
    expect(syncService.pullAll).toHaveBeenCalledTimes(1);
  });

  it("passes accessibility check", async () => {
    const { container } = renderWithProviders(<Navigation />, { route: "/" });

    await assertAccessible(container);
  });
});
