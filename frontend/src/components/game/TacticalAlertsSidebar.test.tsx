import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen } from "../../test-utils";
import { TacticalAlertsSidebar, TacticalAlert } from "./TacticalAlertsSidebar";
import React from "react";

describe("TacticalAlertsSidebar", () => {
  it("renders empty state", () => {
    render(<TacticalAlertsSidebar alerts={[]} />);
    expect(screen.getByText("No active tactical threats.")).toBeInTheDocument();
  });

  it("renders alerts with different severities and types", () => {
    const alerts: TacticalAlert[] = [
      {
        id: "1",
        type: "FATIGUE",
        severity: "WARNING",
        message: "Player A is tired",
        actionLabel: "Sub Out",
        onAction: vi.fn(),
      },
      {
        id: "2",
        type: "FOUL",
        severity: "CRITICAL",
        message: "Player B in foul trouble",
        actionLabel: "Protect",
        onAction: vi.fn(),
      },
      {
        id: "3",
        type: "BONUS",
        severity: "info",
        message: "Team in bonus",
      },
    ];

    render(<TacticalAlertsSidebar alerts={alerts} />);

    expect(screen.getByText("Player A is tired")).toBeInTheDocument();
    expect(screen.getByText("Sub Out")).toBeInTheDocument();
    expect(screen.getByText("Player B in foul trouble")).toBeInTheDocument();
    expect(screen.getByText("Protect")).toBeInTheDocument();
    expect(screen.getByText("Team in bonus")).toBeInTheDocument();
  });

  it("calls onAction when action button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const alerts: TacticalAlert[] = [
      {
        id: "1",
        type: "FATIGUE",
        severity: "WARNING",
        message: "Player A is tired",
        actionLabel: "Sub Out",
        onAction,
      },
    ];

    render(<TacticalAlertsSidebar alerts={alerts} />);
    await user.click(screen.getByRole("button", { name: "Sub Out" }));
    expect(onAction).toHaveBeenCalled();
  });
});
