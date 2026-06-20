import { expect, vi, beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import React from "react";
import { mockDb } from "./dbMock";
import { server } from "./mocks/server";

const originalConsoleError = console.error.bind(console);

console.error = (...args: unknown[]) => {
  const firstArg = args[0];
  const message =
    typeof firstArg === "string"
      ? firstArg
      : firstArg instanceof Error
        ? firstArg.message
        : "";

  if (message.includes("Could not parse CSS stylesheet")) {
    return;
  }

  originalConsoleError(...args);
};

// Start MSW before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers between tests (allows per-test overrides)
afterEach(() => server.resetHandlers());

// Stop MSW after all tests
afterAll(() => server.close());

expect.extend(toHaveNoViolations);

// Mock Cognito
vi.mock("amazon-cognito-identity-js", () => {
  const CognitoUserPool = vi.fn().mockImplementation(function (this: unknown) {
    (this as Record<string, unknown>).getCurrentUser = vi.fn();
  });
  const CognitoUser = vi.fn().mockImplementation(function (this: unknown) {
    (this as Record<string, unknown>).authenticateUser = vi.fn();
    (this as Record<string, unknown>).getSession = vi.fn((callback) => {
      callback(null, {
        isValid: () => true,
        getAccessToken: () => ({
          getJwtToken: () => "mock-token",
        }),
      });
    });
    (this as Record<string, unknown>).signOut = vi.fn();
  });
  const AuthenticationDetails = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    data: {
      Username: string;
      Password: string;
    },
  ) {
    this.getPassword = vi.fn().mockReturnValue(data?.Password ?? "");
    this.getUsername = vi.fn().mockReturnValue(data?.Username ?? "");
  });

  return {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
  };
});

(globalThis as any).mockDb = mockDb;

vi.mock("./db", () => ({
  db: (globalThis as any).mockDb,
  AppDatabase: vi.fn(),
}));

// Mock crypto for randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Math.random(),
});

// Mock AnimatedNumber
vi.mock("./components/SharedUI", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    AnimatedNumber: ({ value, decimals = 0 }: any) =>
      React.createElement("span", null, (value ?? 0).toFixed(decimals)),
  };
});

// Mock dexie-react-hooks
const resolveRecursive = (res: any): any => {
  if (!res) return res;
  if (typeof res === "object" && res.isSync) {
    if (res.status === "rejected") return undefined;
    return resolveRecursive(res.value);
  }
  if (res instanceof Promise) return undefined;
  return res;
};

const useLiveQueryMock = vi.fn((cb: any, deps: any) => {
  const [val, setVal] = React.useState(() => {
    try {
      return resolveRecursive(cb());
    } catch (e) {
      return undefined;
    }
  });

  React.useLayoutEffect(() => {
    let isMounted = true;
    const update = () => {
      if (!isMounted) return;
      try {
        const current = cb();
        const resolved = resolveRecursive(current);
        if (resolved === undefined && current instanceof Promise) {
          current
            .then((v) => {
              if (isMounted) setVal(resolveRecursive(v));
            })
            .catch(() => {
              if (isMounted) setVal(undefined);
            });
        } else {
          if (isMounted) setVal(resolved);
        }
      } catch (e) {
        if (isMounted) setVal(undefined);
      }
    };

    const sharedDb = (globalThis as any).mockDb;
    let unsubscribe = () => {};
    if (sharedDb && typeof sharedDb.subscribe === "function") {
      unsubscribe = sharedDb.subscribe(update);
    }
    update();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, deps || []);

  return val;
});

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: useLiveQueryMock,
}));

// Mock ResizeObserver for happy-dom
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for happy-dom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
