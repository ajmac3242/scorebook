import {
  renderWithProviders as render,
  screen,
  waitFor,
  assertAccessible,
  act,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
import Login from "./Login";
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
    (window as any).isTesting = true;
  });

  it("renders login form", async () => {
    await act(async () => {
      render(<Login />);
    });
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
    const { container } = await act(async () => {
      return render(
        <AuthProvider>
          <Login />
        </AuthProvider>,
      );
    });
    await assertAccessible(container);
  });

  it("handles successful login", async () => {
    const user = userEvent.setup();
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
    render(<Login />);
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(authenticateUserMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/teams");
    });
  });

  it("handles login failure", async () => {
    const user = userEvent.setup();
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.onFailure({ message: "Invalid credentials" });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    render(<Login />);
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("handles new password required", async () => {
    const user = userEvent.setup();
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.newPasswordRequired({}, {});
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );
    render(<Login />);
    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));
    await waitFor(() => {
      expect(screen.getByText(/New password required/i)).toBeInTheDocument();
    });
  });

  it("passes complex password with special characters (including !) verbatim to AuthenticationDetails", async () => {
    const user = userEvent.setup();
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

    render(<Login />);

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
    const user = userEvent.setup();
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

    render(<Login />);

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

  it("shows error message when Cognito network request fails", async () => {
    const user = userEvent.setup();
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.onFailure({ message: "Network error" });
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );

    await act(async () => {
      render(
        <AuthProvider>
          <Login />
        </AuthProvider>,
      );
    });

    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "badpassword");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("shows new password required prompt when Cognito requires password reset", async () => {
    const user = userEvent.setup();
    const authenticateUserMock = vi.fn((_authDetails, callbacks) => {
      callbacks.newPasswordRequired({}, {});
    });
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );

    await act(async () => {
      render(
        <AuthProvider>
          <Login />
        </AuthProvider>,
      );
    });

    await user.type(screen.getByLabelText(/Username/i), "testuser");
    await user.type(screen.getByLabelText(/Password/i), "temppassword");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(
      await screen.findByText("New password required"),
    ).toBeInTheDocument();
  });

  it("does not submit and shows no network call when fields are empty", async () => {
    const user = userEvent.setup();
    const authenticateUserMock = vi.fn();
    (CognitoUser as unknown as Record<string, any>).mockImplementation(
      function (this: Record<string, any>) {
        this.authenticateUser = authenticateUserMock;
      },
    );

    await act(async () => {
      render(
        <AuthProvider>
          <Login />
        </AuthProvider>,
      );
    });

    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(vi.mocked(CognitoUser)).not.toHaveBeenCalled();
  });
});
