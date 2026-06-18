import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen, fireEvent } from "../../../test-utils";
import { EditClockDialog } from "./EditClockDialog";
import React from "react";


const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialMinutes: 8,
  initialSeconds: 30,
};

describe("EditClockDialog", () => {
  it("renders correctly with initial values", () => {
    render(<EditClockDialog {...defaultProps} />);

    expect(screen.getByText("Edit Clock")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("updates state when props change while open", () => {
    const { rerender } = render(<EditClockDialog {...defaultProps} />);

    rerender(<EditClockDialog
          {...defaultProps}
          initialMinutes={12}
          initialSeconds={45}
        />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("allows selecting preset minutes", () => {
    render(<EditClockDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("12:00"));
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("00")).toBeInTheDocument();
  });

  it("allows manual adjustment of minutes", () => {
    render(<EditClockDialog {...defaultProps} />);

    const incMin = screen.getByLabelText("Increase minutes");
    const decMin = screen.getByLabelText("Decrease minutes");

    fireEvent.click(incMin);
    expect(screen.getByText("9")).toBeInTheDocument();

    fireEvent.click(decMin);
    fireEvent.click(decMin);
    expect(screen.getByText("7")).toBeInTheDocument();

    // Test upper/lower bounds
    for (let i = 0; i < 100; i++) fireEvent.click(incMin);
    expect(screen.getByText("99")).toBeInTheDocument();

    for (let i = 0; i < 110; i++) fireEvent.click(decMin);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("allows manual adjustment of seconds with wrapping", () => {
    render(<EditClockDialog {...defaultProps} initialSeconds={59} />);

    const incSec = screen.getByLabelText("Increase seconds");
    const decSec = screen.getByLabelText("Decrease seconds");

    fireEvent.click(incSec);
    expect(screen.getByText("00")).toBeInTheDocument();

    fireEvent.click(decSec);
    expect(screen.getByText("59")).toBeInTheDocument();
  });

  it("calls onSave with correct values", () => {
    render(<EditClockDialog {...defaultProps} />);

    fireEvent.click(screen.getByText("10:00"));
    fireEvent.click(screen.getByRole("button", { name: /Save Clock/i }));

    expect(defaultProps.onSave).toHaveBeenCalledWith(10, 0);
  });

  it("calls onClose on Cancel", () => {
    render(<EditClockDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
