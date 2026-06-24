import {
  renderWithProviders as render,
  screen,
  waitFor,
  useAuth,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthContext";
import { UserPool } from "../UserPool";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import React from "react";
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
  const { isAuthenticated, loading, logout } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sets authenticated state and calls pullAll if user session exists", async () => {
    const mockUser = {
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "mock-token" }),
        }),
      ),
    };
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
      { withAuth: false },
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Authenticated",
      );
      expect(syncService.pullAll).toHaveBeenCalled();
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
      { withAuth: false },
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
      expect(syncService.pullAll).not.toHaveBeenCalled();
    });
  });

  it("sets not authenticated if no user exists", async () => {
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
      { withAuth: false },
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
      expect(syncService.pullAll).not.toHaveBeenCalled();
    });
  });

  it("handles logout", async () => {
    const user = userEvent.setup();
    const mockUser = {
      getSession: vi.fn((cb) =>
        cb(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "mock-token" }),
        }),
      ),
      signOut: vi.fn(),
    };
    vi.mocked(UserPool.getCurrentUser).mockReturnValue(mockUser as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
      { withAuth: false },
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Authenticated",
      );
    });

    await user.click(screen.getByText("Logout"));

    expect(mockUser.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
    });
  });
});
