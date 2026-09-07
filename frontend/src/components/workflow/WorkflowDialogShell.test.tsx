import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import WorkflowDialogShell from "./WorkflowDialogShell";

describe("WorkflowDialogShell", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: "Setup Team",
    description: "Configure team identity and settings",
    steps: ["Identity", "Roster", "Review"],
    activeStep: 0,
    onBack: vi.fn(),
    onNext: vi.fn(),
    onSubmit: vi.fn(),
  };

  it("renders dialog title, description, stepper, and children", () => {
    render(
      <WorkflowDialogShell {...defaultProps}>
        <div>Step 1 Form Content</div>
      </WorkflowDialogShell>,
    );

    expect(screen.getByText("Setup Team")).toBeInTheDocument();
    expect(
      screen.getByText("Configure team identity and settings"),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 Form Content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });

  it("calls onNext when next button is clicked on non-last step", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(
      <WorkflowDialogShell {...defaultProps} onNext={onNext}>
        <div>Step 1</div>
      </WorkflowDialogShell>,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button is clicked on non-first step", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <WorkflowDialogShell {...defaultProps} activeStep={1} onBack={onBack}>
        <div>Step 2</div>
      </WorkflowDialogShell>,
    );

    const backBtn = screen.getByRole("button", { name: "Back" });
    expect(backBtn).toBeInTheDocument();
    await user.click(backBtn);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders submit button on last step and calls onSubmit when clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WorkflowDialogShell
        {...defaultProps}
        activeStep={2}
        onSubmit={onSubmit}
        submitLabel="Finish Setup"
      >
        <div>Step 3 Final Review</div>
      </WorkflowDialogShell>,
    );

    const submitBtn = screen.getByRole("button", { name: "Finish Setup" });
    expect(submitBtn).toBeInTheDocument();

    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows submitting label when isSubmitting is true", () => {
    render(
      <WorkflowDialogShell {...defaultProps} activeStep={2} isSubmitting={true}>
        <div>Submitting State</div>
      </WorkflowDialogShell>,
    );

    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("passes accessibility assertions", async () => {
    const { container } = render(
      <WorkflowDialogShell {...defaultProps}>
        <div>Accessible Step Form</div>
      </WorkflowDialogShell>,
    );

    await assertAccessible(container);
  });
});
