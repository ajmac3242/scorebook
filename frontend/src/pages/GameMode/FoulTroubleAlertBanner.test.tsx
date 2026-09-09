import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test-utils/renderWithProviders";
import { FoulTroubleAlertBanner } from "./FoulTroubleAlertBanner";

describe("FoulTroubleAlertBanner", () => {
  it("renders nothing when alert is null", () => {
    const { container } = renderWithProviders(
      <FoulTroubleAlertBanner alert={null} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders player jersey, name, and foul trouble count when alert is provided", () => {
    const mockAlert = {
      playerId: "p1",
      jerseyNumber: "23",
      playerName: "John Doe",
      foulCount: 4,
    };

    renderWithProviders(
      <FoulTroubleAlertBanner alert={mockAlert} onDismiss={vi.fn()} />,
    );

    expect(screen.getByTestId("foul-trouble-alert-banner")).toBeInTheDocument();
    expect(screen.getByText("#23 John Doe")).toBeInTheDocument();
    expect(screen.getByText("- Foul Trouble (4 Fouls)")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();
    const mockAlert = {
      playerId: "p1",
      jerseyNumber: "23",
      playerName: "John Doe",
      foulCount: 4,
    };

    renderWithProviders(
      <FoulTroubleAlertBanner alert={mockAlert} onDismiss={handleDismiss} />,
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
