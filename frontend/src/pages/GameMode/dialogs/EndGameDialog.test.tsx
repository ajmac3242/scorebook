import { renderWithProviders as render, screen, assertAccessible } from "../../../test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { EndGameDialog } from "./EndGameDialog";

describe("EndGameDialog", () => {
  it("renders correctly when open is true", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    render(
      <EndGameDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isEnding={false}
      />,
    );

    expect(screen.getByText("Finalize Game?")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This will mark the game as complete and lock all stats/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Finalize Game" }),
    ).toBeInTheDocument();
  });

  it("handles interactions with userEvent", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    render(
      <EndGameDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isEnding={false}
      />,
    );

    // Click Cancel
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handleClose).toHaveBeenCalledOnce();

    // Click Confirm
    await user.click(screen.getByRole("button", { name: "Finalize Game" }));
    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("disables buttons and shows loading text when isEnding is true", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    render(
      <EndGameDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isEnding={true}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const confirmButton = screen.getByRole("button", { name: "Finalizing..." });

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();
    const { container } = render(
      <EndGameDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isEnding={false}
      />,
    );
    await assertAccessible(container);
  });
});
