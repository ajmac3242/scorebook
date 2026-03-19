import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Cognito
vi.mock("amazon-cognito-identity-js", () => {
  const CognitoUserPool = vi.fn().mockImplementation(function () {
    this.getCurrentUser = vi.fn();
  });
  const CognitoUser = vi.fn().mockImplementation(function () {
    this.authenticateUser = vi.fn();
    this.getSession = vi.fn((callback) => {
      callback(null, { isValid: () => true });
    });
    this.signOut = vi.fn();
  });
  const AuthenticationDetails = vi.fn().mockImplementation(function (data: {
    Username: string;
    Password: string;
  }) {
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
    seasons: { toArray: vi.fn(), add: vi.fn() },
    teams: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
    },
    players: { toArray: vi.fn(), add: vi.fn() },
    teamPlayers: { toArray: vi.fn(), add: vi.fn() },
    games: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
    },
    stats: {
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock dexie-react-hooks
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn((cb) => {
    if (typeof cb === "function") {
      try {
        const res = cb();
        if (res && typeof res.then === "function") {
          return [];
        }
        return res;
      } catch (e) {
        return [];
      }
    }
    return [];
  }),
}));
