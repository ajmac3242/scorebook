import React from "react";
import {
  renderWithProviders,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import DefensiveBreakdownDialog from "./DefensiveBreakdownDialog";
import { BREAKDOWN_REASONS } from "../../../constants/stats";
import { describe, it, expect, vi } from "vitest";

describe("DefensiveBreakdownDialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open", () => {
    renderWithProviders(
      <DefensiveBreakdownDialog open={true} onClose={onClose} />,
    );

    expect(screen.getByText("Defensive Breakdown")).toBeInTheDocument();
    expect(screen.getByText(/Why was this bucket allowed/)).toBeInTheDocument();

    // Check if all breakdown reasons are rendered
    Object.values(BREAKDOWN_REASONS).forEach((reason) => {
      expect(screen.getByText(reason)).toBeInTheDocument();
    });

    expect(screen.getByText("Skip / No Reason")).toBeInTheDocument();
  });

  it("calls onClose with the selected reason", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DefensiveBreakdownDialog open={true} onClose={onClose} />,
    );

    const reason = Object.values(BREAKDOWN_REASONS)[0];
    await user.click(screen.getByText(reason));

    expect(onClose).toHaveBeenCalledWith(reason);
  });

  it("calls onClose without reason when Skip is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DefensiveBreakdownDialog open={true} onClose={onClose} />,
    );

    await user.click(screen.getByText("Skip / No Reason"));

    expect(onClose).toHaveBeenCalledWith();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <DefensiveBreakdownDialog open={true} onClose={onClose} />,
    );
    await assertAccessible(container);
  });
});
