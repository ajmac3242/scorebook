import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
  act,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AddGameDialog from "./AddGameDialog";
import { fireEvent } from "@testing-library/react";

// Mock useTokens hook
vi.mock("../../../theme/useTokens", () => ({
  useTokens: () => ({
    semantic: {
      component: {
        radius: {
          button: 8,
        },
      },
    },
  }),
}));

describe("AddGameDialog", () => {
  beforeEach(() => {
    (window as any).isTesting = true;
  });

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    activeStep: 0,
    setActiveStep: vi.fn(),
    isSubmitting: false,
    allOpponents: [{ id: "opp1", name: "Bulls", roster: [] }],
    allRecentLocations: ["United Center"],
    newOpponent: "",
    setNewOpponent: vi.fn(),
    newOpponentId: undefined,
    setNewOpponentId: vi.fn(),
    newOpponentLogoUrl: "",
    setNewOpponentLogoUrl: vi.fn(),
    newDate: "2023-01-01",
    setNewDate: vi.fn(),
    newTime: "19:00",
    setNewTime: vi.fn(),
    newLocation: "Home",
    setNewLocation: vi.fn(),
    newPeriodType: "QUARTERS" as const,
    setNewPeriodType: vi.fn(),
    newPeriodLength: 12,
    setNewPeriodLength: vi.fn(),
    newTimeoutLimit: 7,
    setNewTimeoutLimit: vi.fn(),
    newFoulLimit: 6,
    setNewFoulLimit: vi.fn(),
    newTacticalKpis: [],
    setNewTacticalKpis: vi.fn(),
  };

  it("renders correctly at step 0 and handles opponent selection", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} />);
    expect(screen.getByText("Schedule new game")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("e.g. Springfield Atoms");
    await user.type(input, "Celtics");
    expect(defaultProps.setNewOpponent).toHaveBeenCalled();

    const logoInput = screen.getByLabelText("Opponent logo URL");
    await user.type(logoInput, "http://logo.com");
    expect(defaultProps.setNewOpponentLogoUrl).toHaveBeenCalled();
  });

  it("handles logistics at step 1", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} activeStep={1} />);

    // fireEvent intentional: userEvent.type has issues with HTML5 date/time inputs in happy-dom
    const dateInput = screen.getByLabelText(/Date/i);
    fireEvent.change(dateInput, { target: { value: "2023-12-25" } });
    expect(defaultProps.setNewDate).toHaveBeenCalledWith("2023-12-25");

    const timeInput = screen.getByLabelText(/Time/i);
    fireEvent.change(timeInput, { target: { value: "20:00" } });
    expect(defaultProps.setNewTime).toHaveBeenCalledWith("20:00");

    const locationInput = screen.getByLabelText(/Location/i);
    await user.type(locationInput, "TD Garden");
    expect(defaultProps.setNewLocation).toHaveBeenCalled();
  });

  it("handles settings at step 2", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} activeStep={2} />);

    const periodLengthInput = screen.getByLabelText(/Period length/i);
    await user.clear(periodLengthInput);
    await user.type(periodLengthInput, "10");
    expect(defaultProps.setNewPeriodLength).toHaveBeenCalled();

    const timeoutsInput = screen.getByLabelText(/Timeouts/i);
    await user.clear(timeoutsInput);
    await user.type(timeoutsInput, "5");
    expect(defaultProps.setNewTimeoutLimit).toHaveBeenCalled();

    const foulsInput = screen.getByLabelText(/Foul limit/i);
    await user.clear(foulsInput);
    await user.type(foulsInput, "5");
    expect(defaultProps.setNewFoulLimit).toHaveBeenCalled();
  });

  it("handles tactical identity kpis at step 3", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} activeStep={3} />);

    const checkbox = screen.getByLabelText("Paint Touches (Rim Pressure)");
    await user.click(checkbox);
    expect(defaultProps.setNewTacticalKpis).toHaveBeenCalled();
  });

  it("renders review at step 4 and submits", async () => {
    const user = userEvent.setup();
    render(
      <AddGameDialog {...defaultProps} activeStep={4} newOpponent="Warriors" />,
    );
    expect(screen.getByText("Review game details")).toBeInTheDocument();
    expect(screen.getByText("Warriors")).toBeInTheDocument();

    const createButton = screen.getByRole("button", { name: "Create game" });
    await user.click(createButton);
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it("handles 'Back' button navigation", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} activeStep={1} />);

    const backButton = screen.getByRole("button", { name: "Back" });
    await user.click(backButton);
    expect(defaultProps.setActiveStep).toHaveBeenCalled();
  });

  it("disables buttons when isSubmitting is true", () => {
    render(
      <AddGameDialog {...defaultProps} activeStep={4} isSubmitting={true} />,
    );
    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<AddGameDialog {...defaultProps} />);
    await assertAccessible(container);
  });
});
