import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PracticePlannerDialog } from "./PracticePlannerDialog";

describe("PracticePlannerDialog", () => {
  const mockOnClose = vi.fn();

  const mockFocusAreas = [
    {
      metric: "Free Throw %",
      value: "55.5%",
      average: "75.0%",
      drill: "Pressure Free Throws",
      description: "Perform 10 free throws with consequences for misses.",
    },
    {
      metric: "Turnovers",
      value: "18",
      average: "12",
      drill: "3-on-2 Continuous",
      description: "Focus on making clean passes under pressure.",
    },
  ];

  it("renders with practice recommendations and handles close", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PracticePlannerDialog
        open={true}
        onClose={mockOnClose}
        practiceFocusAreas={mockFocusAreas}
      />,
    );

    // Verify Title
    expect(
      screen.getByText("Practice Prescription Engine"),
    ).toBeInTheDocument();

    // Verify descriptions and drill details
    expect(screen.getByText("Free Throw %: 55.5%")).toBeInTheDocument();
    expect(screen.getByText("Season Avg: 75.0%")).toBeInTheDocument();
    expect(screen.getByText("DRILL: Pressure Free Throws")).toBeInTheDocument();
    expect(
      screen.getByText("Perform 10 free throws with consequences for misses."),
    ).toBeInTheDocument();

    expect(screen.getByText("Turnovers: 18")).toBeInTheDocument();
    expect(screen.getByText("Season Avg: 12")).toBeInTheDocument();
    expect(screen.getByText("DRILL: 3-on-2 Continuous")).toBeInTheDocument();
    expect(
      screen.getByText("Focus on making clean passes under pressure."),
    ).toBeInTheDocument();

    // Test close button
    const closeBtn = screen.getByRole("button", { name: "Close" });
    await user.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Assert accessibility
    await assertAccessible(container);
  });

  it("renders an alert when there are no focus areas", async () => {
    const { container } = render(
      <PracticePlannerDialog
        open={true}
        onClose={mockOnClose}
        practiceFocusAreas={[]}
      />,
    );

    expect(
      screen.getByText(
        "Great performance! No major statistical deviations detected requiring specialized drills.",
      ),
    ).toBeInTheDocument();

    await assertAccessible(container);
  });
});
