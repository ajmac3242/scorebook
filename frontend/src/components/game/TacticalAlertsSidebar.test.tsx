import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TacticalAlertsSidebar, TacticalAlert } from "./TacticalAlertsSidebar";
import { renderWithProviders } from "../../test-utils";

describe("TacticalAlertsSidebar", () => {
  it("renders empty state message when no alerts are provided", () => {
    renderWithProviders(<TacticalAlertsSidebar alerts={[]} />);
    expect(screen.getByText(/No active tactical threats/i)).toBeInTheDocument();
  });

  it("renders alerts correctly", () => {
    const alerts: TacticalAlert[] = [
      {
        id: "1",
        type: "FOUL",
        severity: "CRITICAL",
        message: "Player A is in foul trouble",
      },
      {
        id: "2",
        type: "FATIGUE",
        severity: "WARNING",
        message: "Player B is tired",
      },
    ];

    renderWithProviders(<TacticalAlertsSidebar alerts={alerts} />);
    expect(screen.getByText("Player A is in foul trouble")).toBeInTheDocument();
    expect(screen.getByText("Player B is tired")).toBeInTheDocument();
  });

  it("calls onAction when action button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const alerts: TacticalAlert[] = [
      {
        id: "1",
        type: "FOUL",
        severity: "CRITICAL",
        message: "Player A is in foul trouble",
        actionLabel: "Sub Out",
        onAction,
      },
    ];

    renderWithProviders(<TacticalAlertsSidebar alerts={alerts} />);
    const button = screen.getByRole("button", { name: /sub out/i });
    await user.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders different severities and types", () => {
    const alerts: TacticalAlert[] = [
      {
        id: "1",
        type: "BONUS",
        severity: "info",
        message: "Team is in bonus",
      },
      {
        id: "2",
        type: "CONFLICT",
        severity: "warning",
        message: "Conflict detected",
      },
    ];

    renderWithProviders(<TacticalAlertsSidebar alerts={alerts} />);
    expect(screen.getByText("Team is in bonus")).toBeInTheDocument();
    expect(screen.getByText("Conflict detected")).toBeInTheDocument();
  });
});
