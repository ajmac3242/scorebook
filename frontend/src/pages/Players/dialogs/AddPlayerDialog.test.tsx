import { renderWithProviders, screen, act } from "../../../test-utils";
import AddPlayerDialog from "./AddPlayerDialog";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

describe("AddPlayerDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Create Player dialog content when open", async () => {
    await act(async () => {
      renderWithProviders(<AddPlayerDialog {...defaultProps} />);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create player")).toBeInTheDocument();
  });

  it("calls onClose when cancel or close button is clicked", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithProviders(<AddPlayerDialog {...defaultProps} />);
    });

    const closeBtn = screen.getByRole("button", { name: "Cancel" });
    await user.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = renderWithProviders(
        <AddPlayerDialog {...defaultProps} />,
      );
      container = rendered.container;
    });
    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
