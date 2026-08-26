import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import { ExpandedSectionDialog } from "./ExpandedSectionDialog";

describe("ExpandedSectionDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: "Expanded Box Score",
    children: <div data-testid="test-content">Dialog Content Body</div>,
  };

  it("renders title and children when open", () => {
    render(<ExpandedSectionDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Expanded Box Score")).toBeInTheDocument();
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    render(<ExpandedSectionDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Expanded Box Score")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<ExpandedSectionDialog {...defaultProps} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /^close$/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the collapse icon button is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<ExpandedSectionDialog {...defaultProps} onClose={handleClose} />);

    const collapseBtn = screen.getByRole("button", {
      name: /collapse section/i,
    });
    await user.click(collapseBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ExpandedSectionDialog {...defaultProps} />);
    await assertAccessible(container);
  });
});
