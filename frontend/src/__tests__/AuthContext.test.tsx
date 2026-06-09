import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { UserPool } from "../UserPool";
import { syncService } from "../utils/syncService";

vi.mock("../utils/syncService", () => ({
  syncService: {
    pullAll: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("../UserPool", () => ({
  UserPool: {
    getCurrentUser: vi.fn(),
  },
}));

const TestComponent = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</div>;
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets authenticated state and calls pullAll if user session exists", async () => {
    const mockUser = {
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
        }),
      ),
    };
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Authenticated")).toBeInTheDocument();
      expect(syncService.pullAll).toHaveBeenCalled();
    });
  });

  it("sets not authenticated if no session exists", async () => {
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
      expect(syncService.pullAll).not.toHaveBeenCalled();
    });
  });

  it("sets not authenticated if session is invalid", async () => {
    const mockUser = {
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => false,
        }),
      ),
    };
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
    });
  });
});
