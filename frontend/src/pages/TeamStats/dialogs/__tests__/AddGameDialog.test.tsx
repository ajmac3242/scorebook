/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AddGameDialog from "../AddGameDialog";

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
    tokens: {
      semantic: {
        component: {
          radius: {
            button: 8,
          },
        },
      },
    } as any,
  };

  it("renders correctly at step 0", () => {
    render(<AddGameDialog {...defaultProps} />);
    expect(screen.getByText("Schedule new game")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Springfield Atoms")).toBeDefined();
    expect(screen.getByText("Continue")).toBeDefined();
  });

  it("calls setNewOpponent when opponent name changes", () => {
    render(<AddGameDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("e.g. Springfield Atoms");
    fireEvent.change(input, { target: { value: "Celtics" } });
    expect(defaultProps.setNewOpponent).toHaveBeenCalled();
  });

  it("advances to next step when Continue is clicked", () => {
    const props = { ...defaultProps, newOpponent: "Heat" };
    render(<AddGameDialog {...props} />);
    fireEvent.click(screen.getByText("Continue"));
    expect(defaultProps.setActiveStep).toHaveBeenCalled();
  });

  it("renders logistics at step 1", () => {
    render(<AddGameDialog {...defaultProps} activeStep={1} />);
    // Use display value or text for logistics step
    expect(screen.getByLabelText(/Date/i)).toBeDefined();
    expect(screen.getByLabelText(/Time/i)).toBeDefined();
  });

  it("renders settings at step 2", () => {
    render(<AddGameDialog {...defaultProps} activeStep={2} />);
    expect(screen.getAllByText("Period type").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Period length/i)).toBeDefined();
  });

  it("renders tactical identity at step 3", () => {
    render(<AddGameDialog {...defaultProps} activeStep={3} />);
    expect(screen.getByText("SELECT TACTICAL IDENTITY KPIS")).toBeDefined();
    expect(screen.getByText("Paint Touches (Rim Pressure)")).toBeDefined();
  });

  it("renders review at step 4", () => {
    render(
      <AddGameDialog {...defaultProps} activeStep={4} newOpponent="Warriors" />,
    );
    expect(screen.getByText("Review game details")).toBeDefined();
    expect(screen.getByText("Warriors")).toBeDefined();
    expect(screen.getByText("Create game")).toBeDefined();
  });

  it("calls onSubmit when Create game is clicked", () => {
    render(<AddGameDialog {...defaultProps} activeStep={4} />);
    fireEvent.click(screen.getByText("Create game"));
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });
});
