import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { UserPool } from "../UserPool";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import React from "react";

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

  it("sets authenticated to true if user session is valid", async () => {
    const mockUser = {
      getSession: vi.fn((callback) =>
        callback(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "mock-token" }),
        }),
      ),
    };
    (UserPool.getCurrentUser as Mock).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Authenticated",
      );
    });
  });

  it("sets authenticated to false if session is invalid", async () => {
    const mockUser = {
      getSession: vi.fn((callback) =>
        callback(new Error("Session error"), null),
      ),
    };
    (UserPool.getCurrentUser as Mock).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
    });
  });

  it("sets authenticated to false if no user exists", async () => {
    (UserPool.getCurrentUser as Mock).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
    });
  });

  it("handles logout", async () => {
    const mockUser = {
      getSession: vi.fn((callback) =>
        callback(null, {
          isValid: () => true,
          getAccessToken: () => ({ getJwtToken: () => "mock-token" }),
        }),
      ),
      signOut: vi.fn(),
    };
    (UserPool.getCurrentUser as Mock).mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Authenticated",
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
    });

    expect(mockUser.signOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Not Authenticated",
      );
    });
  });
});
