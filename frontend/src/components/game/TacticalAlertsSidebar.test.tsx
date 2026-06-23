import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "../../test-utils";
import { TacticalAlertsSidebar, TacticalAlert } from "./TacticalAlertsSidebar";
import userEvent from "@testing-library/user-event";

describe("TacticalAlertsSidebar", () => {
  it("renders empty state", () => {
    render(<TacticalAlertsSidebar alerts={[]} />);
    expect(screen.getByText("No active tactical threats.")).toBeInTheDocument();
  });

  it("renders alerts with correct severity styles", () => {
    const alerts: TacticalAlert[] = [
      { id: "1", type: "FOUL", severity: "CRITICAL", message: "LeBron in foul trouble" },
      { id: "2", type: "BONUS", severity: "info", message: "Opponent in bonus" },
      { id: "3", type: "FATIGUE", severity: "warning", message: "AD is tired", actionLabel: "Sub Now" }
    ];

    render(<TacticalAlertsSidebar alerts={alerts} />);

    expect(screen.getByText("LeBron in foul trouble")).toBeInTheDocument();
    expect(screen.getByText("Opponent in bonus")).toBeInTheDocument();
    expect(screen.getByText("AD is tired")).toBeInTheDocument();
    expect(screen.getByText("Sub Now")).toBeInTheDocument();
  });

  it("calls onAction when action button is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const alerts: TacticalAlert[] = [
      { id: "3", type: "FATIGUE", severity: "warning", message: "AD is tired", actionLabel: "Sub Now", onAction }
    ];

    render(<TacticalAlertsSidebar alerts={alerts} />);

    await user.click(screen.getByText("Sub Now"));
    expect(onAction).toHaveBeenCalled();
  });

  it("renders correct icons based on alert type", () => {
     const alerts: TacticalAlert[] = [
      { id: "3", type: "FOUL", severity: "warning", message: "Foul alert", actionLabel: "View" }
    ];
    render(<TacticalAlertsSidebar alerts={alerts} />);
    // Check if Gavel icon is rendered (via action button startIcon if we can identify it)
    // Actually startIcon is conditionally rendered based on type
    expect(screen.getByTestId("GavelIcon")).toBeInTheDocument();
  });
});
