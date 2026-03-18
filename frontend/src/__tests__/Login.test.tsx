import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CognitoUser } from "amazon-cognito-identity-js";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    const authenticateUserMock = vi.fn((authDetails, callbacks) => {
      callbacks.onSuccess({ getAccessToken: () => ({ getJwtToken: () => "token" }) });
    });

    (CognitoUser as any).mockImplementation(function () {
      this.authenticateUser = authenticateUserMock;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(authenticateUserMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("handles login failure", async () => {
    const authenticateUserMock = vi.fn((authDetails, callbacks) => {
      callbacks.onFailure({ message: "Invalid credentials" });
    });

    (CognitoUser as any).mockImplementation(function () {
      this.authenticateUser = authenticateUserMock;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("handles new password required", async () => {
    const authenticateUserMock = vi.fn((authDetails, callbacks) => {
      callbacks.newPasswordRequired({}, {});
    });

    (CognitoUser as any).mockImplementation(function () {
      this.authenticateUser = authenticateUserMock;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/New password required/i)).toBeInTheDocument();
    });
  });
});
