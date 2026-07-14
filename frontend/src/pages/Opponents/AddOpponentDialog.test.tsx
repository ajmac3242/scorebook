import React from "react";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  assertAccessible,
  act,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AddOpponentDialog from "./AddOpponentDialog";
import { mockDb } from "../../dbMock";
import { syncService } from "../../utils/syncService";

// Mock sync service
vi.mock("../../utils/syncService", () => ({
  syncService: {
    pushUpdates: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("AddOpponentDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onAdded: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    mockDb.reset();
    vi.clearAllMocks();
  });

  it("renders correctly when open", async () => {
    render(<AddOpponentDialog {...defaultProps} />);
    expect(screen.getByText("Add New Opponent")).toBeInTheDocument();
    expect(screen.getByLabelText("Opponent Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Logo URL")).toBeInTheDocument();
  });

  it("handles successful submission", async () => {
    const user = userEvent.setup();
    render(<AddOpponentDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Opponent Name"), "Celtics");
    await user.type(screen.getByLabelText("Logo URL"), "http://celtics.com/logo.png");

    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(mockDb.opponents.data).toHaveLength(1);
      expect(mockDb.opponents.data[0].name).toBe("Celtics");
      expect(mockDb.opponents.data[0].logoUrl).toBe("http://celtics.com/logo.png");
      expect(defaultProps.onAdded).toHaveBeenCalledWith("Celtics");
      expect(syncService.pushUpdates).toHaveBeenCalled();
    });
  });

  it("handles submission with Enter key", async () => {
    const user = userEvent.setup();
    render(<AddOpponentDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Opponent Name"), "Bulls{Enter}");

    await waitFor(() => {
      expect(mockDb.opponents.data).toHaveLength(1);
      expect(mockDb.opponents.data[0].name).toBe("Bulls");
      expect(defaultProps.onAdded).toHaveBeenCalledWith("Bulls");
    });
  });

  it("handles cancel", async () => {
    const user = userEvent.setup();
    render(<AddOpponentDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("handles error during submission", async () => {
    const user = userEvent.setup();
    vi.spyOn(mockDb.opponents, "add").mockRejectedValueOnce(new Error("DB Error"));

    render(<AddOpponentDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Opponent Name"), "Knicks");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith("Failed to add opponent. Please try again.");
    });
  });

  it("disables buttons while submitting", async () => {
    const user = userEvent.setup();
    // Delay the mock response
    vi.spyOn(mockDb.opponents, "add").mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("id"), 100)) as any);

    render(<AddOpponentDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Opponent Name"), "Nets");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("does not close when submitting", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    vi.spyOn(mockDb.opponents, "add").mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("id"), 100)) as any);

    render(<AddOpponentDialog {...defaultProps} />);

    await user.type(screen.getByLabelText("Opponent Name"), "Nets");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // Try to close. user.click will fail because of pointer-events: none, so we use fireEvent or disable the check.
    // userEvent 14 allows disabling pointerEventsCheck.
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(<AddOpponentDialog {...defaultProps} />);
      container = rendered.container;
    });
    await waitFor(() => {
      expect(screen.getByText("Add New Opponent")).toBeInTheDocument();
    });
    await assertAccessible(container!);
  });
});
