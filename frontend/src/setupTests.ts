import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Cognito
vi.mock("amazon-cognito-identity-js", () => {
  const CognitoUserPool = vi.fn().mockImplementation(function (this: unknown) {
    ((this as unknown) as Record<string, unknown>).getCurrentUser = vi.fn();
  });
  const CognitoUser = vi.fn().mockImplementation(function (this: unknown) {
    ((this as unknown) as Record<string, unknown>).authenticateUser = vi.fn();
    ((this as unknown) as Record<string, unknown>).getSession = vi.fn(
      (callback) => {
        callback(null, {
          isValid: () => true,
          getAccessToken: () => ({
            getJwtToken: () => "mock-token",
          }),
        });
      },
    );
    ((this as unknown) as Record<string, unknown>).signOut = vi.fn();
  });
  const AuthenticationDetails = vi.fn().mockImplementation(function (
    this: unknown,
    data: {
      Username: string;
      Password: string;
    },
  ) {
    // Store credentials so tests can inspect them via getPassword() / getUsername()
    this.getPassword = vi.fn().mockReturnValue(data?.Password ?? "");
    this.getUsername = vi.fn().mockReturnValue(data?.Username ?? "");
  });

  return {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
  };
});

// Mock Dexie
vi.mock("./db", () => ({
  db: {
    open: vi.fn().mockResolvedValue(null),
    teams: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      anyOf: vi.fn().mockReturnThis(),
    },
    players: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toCollection: vi.fn().mockReturnThis(),
    },
    teamPlayers: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      delete: vi.fn(),
      first: vi.fn(),
    },
    games: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      anyOf: vi.fn().mockReturnThis(),
    },
    stats: {
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      delete: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
    },
    transaction: vi.fn((_mode, _tables, callback) => callback()),
  },
}));

// Mock fetch globally to prevent ERR_INVALID_URL for relative paths in tests
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
    headers: new Headers(),
  }),
);

// Mock dexie-react-hooks
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn((cb) => {
    if (typeof cb === "function") {
      try {
        const res = cb();
        if (res && typeof res.then === "function") {
          return undefined; // Or some meaningful default
        }
        return res;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }),
}));
