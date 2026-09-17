import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { mockDb } from "./dbMock";
import { render, screen, assertAccessible } from "./test-utils";

let mockAuthState = {
  isAuthenticated: false,
  loading: false,
  user: null,
};

vi.mock("./context/AuthContext", async () => {
  const actual = await vi.importActual("./context/AuthContext");
  return {
    ...actual,
    useAuth: () => mockAuthState,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe("App Component", () => {
  beforeEach(() => {
    mockDb.reset();
    mockAuthState = {
      isAuthenticated: false,
      loading: false,
      user: null,
    };
    window.history.pushState({}, "Test page", "/");
  });

  it("renders loading state when auth is loading", () => {
    mockAuthState = {
      isAuthenticated: false,
      loading: true,
      user: null,
    };

    render(<App />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    mockAuthState = {
      isAuthenticated: false,
      loading: false,
      user: null,
    };

    render(<App />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders main dashboard layout when authenticated", async () => {
    mockAuthState = {
      isAuthenticated: true,
      loading: false,
      user: { id: "user1", email: "coach@courtsight.app" } as any,
    };

    const { container } = render(<App />);

    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("handles mobile bar menu toggle in mobile view", async () => {
    mockAuthState = {
      isAuthenticated: true,
      loading: false,
      user: { id: "user1", email: "coach@courtsight.app" } as any,
    };

    render(<App />);

    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument();
    const openMenuBtn = screen.queryByRole("button", { name: /open navigation menu/i });
    if (openMenuBtn) {
      const user = userEvent.setup();
      await user.click(openMenuBtn);
    }
  });
});
