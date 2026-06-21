import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Delete something?",
    description: "Are you sure?",
    confirmLabel: "Delete",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders correctly when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete something?")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows loading state when loading is true", () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("renders destructive button with error color", () => {
    render(<ConfirmDialog {...defaultProps} destructive={true} />);
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    expect(confirmButton).toHaveClass("MuiButton-colorError");
  });
});
