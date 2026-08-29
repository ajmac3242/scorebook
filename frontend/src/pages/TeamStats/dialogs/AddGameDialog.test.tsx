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
import { fireEvent } from "../../../test-utils";

// Mock useTokens hook
vi.mock("../../../theme/useTokens", () => ({
  useTokens: () => ({
    semantic: {
      component: {
        radius: {
          button: 8,
        },
      },
      spacing: {
        sm: 12,
      },
      color: {
        text: {
          secondary: "var(--cs-semantic-color-text-secondary)",
        },
        feedback: {
          success: {
            main: "#10B981",
            dark: "#059669",
          },
        },
      },
    },
    typography: {
      fontWeight: {
        bold: 700,
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
    teamPlayerCount: 5,
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

    // fireEvent intentional: userEvent.type and userEvent.clear have documented compatibility issues with HTML5 date, time, and color inputs in happy-dom
    const dateInput = screen.getByLabelText(/Date/i);
    fireEvent.change(dateInput, { target: { value: "2023-12-25" } });
    expect(defaultProps.setNewDate).toHaveBeenCalledWith("2023-12-25");

    // fireEvent intentional: userEvent.type and userEvent.clear have documented compatibility issues with HTML5 date, time, and color inputs in happy-dom
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

    // Test unchecking
    const uncheckedProps = {
      ...defaultProps,
      activeStep: 3,
      newTacticalKpis: ["paint_touches"],
    };
    render(<AddGameDialog {...uncheckedProps} />);
    // Get all elements with that label and find the one that is a checkbox
    const checkboxes = screen.getAllByLabelText("Paint Touches (Rim Pressure)");
    const checkedBox = checkboxes.find(
      (cb) => (cb as HTMLInputElement).type === "checkbox",
    );
    await user.click(checkedBox!);
    expect(uncheckedProps.setNewTacticalKpis).toHaveBeenCalled();
  });

  it("handles step navigation with Continue button", async () => {
    const user = userEvent.setup();
    render(
      <AddGameDialog {...defaultProps} activeStep={0} newOpponent="Lakers" />,
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });
    await user.click(continueButton);
    expect(defaultProps.setActiveStep).toHaveBeenCalled();
  });

  it("handles opponent selection from Autocomplete options", async () => {
    const user = userEvent.setup();
    const allOpponents = [
      {
        id: "opp1",
        name: "Bulls",
        roster: [],
        logoUrl: "http://bulls.com/logo.png",
      },
    ];
    render(<AddGameDialog {...defaultProps} allOpponents={allOpponents} />);

    const input = screen.getByPlaceholderText("e.g. Springfield Atoms");
    await user.click(input);

    const option = await screen.findByRole("option", { name: "Bulls" });
    await user.click(option);

    expect(defaultProps.setNewOpponent).toHaveBeenCalledWith("Bulls");
    expect(defaultProps.setNewOpponentId).toHaveBeenCalledWith("opp1");
    expect(defaultProps.setNewOpponentLogoUrl).toHaveBeenCalledWith(
      "http://bulls.com/logo.png",
    );
  });

  it("handles clearing opponent selection in Autocomplete", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} newOpponent="Lakers" />);

    const clearButton = screen.getByTitle("Clear");
    await user.click(clearButton);

    expect(defaultProps.setNewOpponent).toHaveBeenCalledWith("");
    expect(defaultProps.setNewOpponentId).toHaveBeenCalledWith(undefined);
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

  it("disables 'Create game' button if teamPlayerCount < 5", async () => {
    render(
      <AddGameDialog
        {...defaultProps}
        activeStep={4}
        newOpponent="Warriors"
        teamPlayerCount={4}
      />,
    );
    const createButton = screen.getByRole("button", { name: "Create game" });
    expect(createButton).toBeDisabled();
    expect(screen.getByText(/Roster Incomplete/i)).toBeInTheDocument();
  });

  it("handles period type change", async () => {
    const user = userEvent.setup();
    render(<AddGameDialog {...defaultProps} activeStep={2} />);

    // MUI Select might be tricky. Let's look for the label first.
    // In happy-dom it might not associate label correctly sometimes.
    const select = screen.getByText("Quarters");
    await user.click(select);

    const option = await screen.findByRole("option", { name: "Halves" });
    await user.click(option);

    expect(defaultProps.setNewPeriodType).toHaveBeenCalledWith("HALVES");
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
