import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import ConfirmDialog from "./ConfirmDialog";
import React from "react";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Confirm Action",
    description: "Are you sure you want to do this?",
    confirmLabel: "Confirm",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to do this?"),
    ).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when confirm is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("shows loading state", () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Delete" loading={true} />,
    );
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
  });

  it("renders with destructive color", () => {
    render(<ConfirmDialog {...defaultProps} destructive={true} />);
    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    expect(confirmButton).toHaveClass("MuiButton-colorError");
  });
});
