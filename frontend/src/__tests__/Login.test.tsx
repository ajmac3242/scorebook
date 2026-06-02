import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../pages/Login";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { CognitoUser } from "amazon-cognito-identity-js";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as Record<string, any>),
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
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.onSuccess({
        getAccessToken: () => ({ getJwtToken: () => "token" }),
      });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    render(
      <BrowserRouter>
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(authenticateUserMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/teams");
    });
  });

  it("handles login failure", async () => {
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.onFailure({ message: "Invalid credentials" });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    render(
      <BrowserRouter>
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("handles new password required", async () => {
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.newPasswordRequired({}, {});
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    render(
      <BrowserRouter>
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText(/New password required/i)).toBeInTheDocument();
    });
  });

  it("passes complex password with special characters (including !) verbatim to AuthenticationDetails", async () => {
    // Regression test: passwords containing ! and other special chars were
    // being mangled before reaching Cognito. Verify the raw string is
    // forwarded unchanged.
    const COMPLEX_PASSWORD =
      "PAqsh4-AbpY_gGFHjubK*gqFu-j6MtvAZ!XGsnMoB7Bqmw7mvj-y@zy-67WZ.Xup";

    let capturedPassword: string | undefined;
    const authenticateUserMock = vi.fn((authDetails, callbacks) => {
      capturedPassword = authDetails.getPassword();
      callbacks.onSuccess({
        getAccessToken: () => ({ getJwtToken: () => "token" }),
      });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    // Ensure we use the mock from setupTests which has getPassword
    // (AuthenticationDetails as any).mockRestore?.();

    render(
      <BrowserRouter>
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: COMPLEX_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(authenticateUserMock).toHaveBeenCalled();
    });

    // Verify the password was not modified before being passed to Cognito
    expect(capturedPassword).toBe(COMPLEX_PASSWORD);
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });

  it("accepts and submits passwords containing ! without error", async () => {
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.onSuccess({
        getAccessToken: () => ({ getJwtToken: () => "token" }),
      });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );

    render(
      <BrowserRouter>
        <CourtSightThemeProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </CourtSightThemeProvider>
      </BrowserRouter>,
    );

    // Passwords with ! should be accepted without validation errors
    fireEvent.change(screen.getByLabelText(/Username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "MyP@ssw0rd!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      // Should succeed - no error displayed
      expect(authenticateUserMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/teams");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
