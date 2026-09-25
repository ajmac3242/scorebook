import React from "react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithProviders as render, screen } from "../../test-utils";
import { describe, expect, it, vi } from "vitest";
import PageSnackbar from "./PageSnackbar";

const wrap = (ui: React.ReactElement) => render(ui);

describe("PageSnackbar", () => {
  it("renders message when open", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Sync complete."
        severity="success"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Sync complete.")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    wrap(
      <PageSnackbar
        open={false}
        message="Hidden"
        severity="success"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders error severity without throwing", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Something went wrong."
        severity="error"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders warning severity without throwing", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Watch out."
        severity="warning"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Watch out.")).toBeInTheDocument();
  });

  it("calls onClose when close icon is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    wrap(
      <PageSnackbar
        open={true}
        message="Dismissible message"
        severity="info"
        onClose={handleClose}
      />,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });

  it("respects custom autoHideDuration prop", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Custom duration"
        severity="info"
        onClose={vi.fn()}
        autoHideDuration={2000}
      />,
    );
    expect(screen.getByText("Custom duration")).toBeInTheDocument();
  });

  it("renders correctly on mobile viewports", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as any;

    wrap(
      <PageSnackbar
        open={true}
        message="Mobile notification"
        severity="info"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Mobile notification")).toBeInTheDocument();
    window.matchMedia = originalMatchMedia;
  });

  it("has no accessibility violations", async () => {
    const { container } = wrap(
      <PageSnackbar
        open={true}
        message="Accessible alert"
        severity="info"
        onClose={vi.fn()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
