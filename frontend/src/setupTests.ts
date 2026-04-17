import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

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
      bulkPut: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      anyOf: vi.fn().mockReturnThis(),
      first: vi.fn(),
    },
    players: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      bulkPut: vi.fn(),
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
      bulkPut: vi.fn(),
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
      bulkPut: vi.fn(),
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
      bulkPut: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
    },
    transaction: vi.fn((_mode, _tables, callback) => callback()),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock crypto for randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Math.random(),
});

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

// Mock HeroUI components to avoid rendering issues in JSDOM
vi.mock("@heroui/system", () => ({
  HeroUIProvider: ({ children }: any) =>
    React.createElement("div", null, children),
}));

vi.mock("@heroui/navbar", () => ({
  Navbar: ({ children }: any) => React.createElement("nav", null, children),
  NavbarBrand: ({ children }: any) =>
    React.createElement("div", null, children),
  NavbarContent: ({ children }: any) =>
    React.createElement("div", null, children),
  NavbarItem: ({ children }: any) => React.createElement("div", null, children),
}));

vi.mock("@heroui/react", () => ({
  Card: ({ children, className }: any) =>
    React.createElement(
      "div",
      { className, "data-testid": "heroui-card" },
      children,
    ),
  CardContent: ({ children }: any) =>
    React.createElement(
      "div",
      { "data-testid": "heroui-card-content" },
      children,
    ),
  CardHeader: ({ children }: any) => React.createElement("div", null, children),
  CardFooter: ({ children }: any) => React.createElement("div", null, children),
  Button: ({ children, onClick, onPress, ...props }: any) =>
    React.createElement(
      "button",
      {
        ...props,
        onClick: (e: any) => {
          if (onClick) onClick(e);
          if (onPress) onPress(e);
        },
      },
      children,
    ),
  Modal: ({ children }: any) => React.createElement("div", null, children),
  ModalContent: ({ children }: any) =>
    React.createElement("div", null, children),
  ModalHeader: ({ children }: any) =>
    React.createElement("div", null, children),
  ModalBody: ({ children }: any) => React.createElement("div", null, children),
  ModalFooter: ({ children }: any) =>
    React.createElement("div", null, children),
  useOverlayState: vi.fn(() => {
    const [isOpen, setIsOpen] = React.useState(false);
    return {
      isOpen,
      open: vi.fn(() => setIsOpen(true)),
      close: vi.fn(() => setIsOpen(false)),
      toggle: vi.fn(() => setIsOpen(!isOpen)),
    };
  }),
  useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
  Select: ({ children }: any) => React.createElement("select", null, children),
  SelectItem: ({ children }: any) =>
    React.createElement("option", null, children),
  ListBoxItem: ({ children }: any) =>
    React.createElement("option", null, children),
  Input: ({ label, onValueChange, ...props }: any) => {
    const id = props.id || `input-${label}`;
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) onValueChange(e.target.value);
      if (props.onChange) props.onChange(e);
    };
    return React.createElement(
      "div",
      null,
      label && React.createElement("label", { htmlFor: id }, label),
      React.createElement("input", { ...props, id, onChange }),
    );
  },
  Tabs: ({ children }: any) => React.createElement("div", null, children),
  Tab: ({ children }: any) => React.createElement("div", null, children),
  Chip: ({ children, startContent }: any) =>
    React.createElement("div", null, startContent, children),
  Avatar: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  Separator: () => React.createElement("hr"),
  ScrollShadow: ({ children, className }: any) =>
    React.createElement("div", { className }, children),
  Alert: ({ children, title, description, status, ...props }: any) =>
    React.createElement(
      "div",
      { role: "alert", "data-status": status, ...props },
      title && React.createElement("div", null, title),
      description && React.createElement("div", null, description),
      children,
    ),
  AlertDialogRoot: ({ children, isOpen }: any) =>
    isOpen
      ? React.createElement(
          "div",
          { "data-testid": "alert-dialog-root" },
          children,
        )
      : null,
  AlertDialogBackdrop: () => null,
  AlertDialogContainer: ({ children }: any) =>
    React.createElement("div", null, children),
  AlertDialogDialog: ({ children }: any) =>
    React.createElement("div", { role: "alertdialog" }, children),
  AlertDialogHeader: ({ children }: any) =>
    React.createElement("div", null, children),
  AlertDialogHeading: ({ children }: any) =>
    React.createElement("h2", null, children),
  AlertDialogBody: ({ children }: any) =>
    React.createElement("div", null, children),
  AlertDialogFooter: ({ children }: any) =>
    React.createElement("div", null, children),
  AlertDialogCloseTrigger: () => null,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    danger: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@heroui/use-disclosure", () => ({
  useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
}));
