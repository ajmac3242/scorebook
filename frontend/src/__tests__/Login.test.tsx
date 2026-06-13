import { renderWithProviders as render, screen, waitFor } from "../test-utils";
import Login from "../pages/Login";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "../context/AuthContext";
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
      <AuthProvider>
        <Login />
      </AuthProvider>,
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
    const { user } = render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
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
    const { user } = render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
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
    const { user } = render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
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

    const { user } = render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), COMPLEX_PASSWORD);
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

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

    const { user } = render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    // Passwords with ! should be accepted without validation errors
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "MyP@ssw0rd!");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      // Should succeed - no error displayed
      expect(authenticateUserMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/teams");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
