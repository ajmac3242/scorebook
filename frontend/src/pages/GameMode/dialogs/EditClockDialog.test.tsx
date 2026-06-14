import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditClockDialog } from "./EditClockDialog";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialMinutes: 8,
  initialSeconds: 30,
};

describe("EditClockDialog", () => {
  it("renders correctly with initial values", () => {
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    expect(screen.getByText("Edit Clock")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("updates state when props change while open", () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    rerender(
      <ThemeProvider theme={theme}>
        <EditClockDialog
          {...defaultProps}
          initialMinutes={12}
          initialSeconds={45}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("allows selecting preset minutes", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("12:00"));
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("00")).toBeInTheDocument();
  });

  it("allows manual adjustment of minutes", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    const incMin = screen.getByLabelText("Increase minutes");
    const decMin = screen.getByLabelText("Decrease minutes");

    await user.click(incMin);
    expect(screen.getByText("9")).toBeInTheDocument();

    await user.click(decMin);
    await user.click(decMin);
    expect(screen.getByText("7")).toBeInTheDocument();

    // Test upper/lower bounds
    for (let i = 0; i < 100; i++) await user.click(incMin);
    expect(screen.getByText("99")).toBeInTheDocument();

    for (let i = 0; i < 110; i++) await user.click(decMin);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("allows manual adjustment of seconds with wrapping", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} initialSeconds={59} />
      </ThemeProvider>,
    );

    const incSec = screen.getByLabelText("Increase seconds");
    const decSec = screen.getByLabelText("Decrease seconds");

    await user.click(incSec);
    expect(screen.getByText("00")).toBeInTheDocument();

    await user.click(decSec);
    expect(screen.getByText("59")).toBeInTheDocument();
  });

  it("calls onSave with correct values", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    await user.click(screen.getByText("10:00"));
    await user.click(screen.getByRole("button", { name: /Save Clock/i }));

    expect(defaultProps.onSave).toHaveBeenCalledWith(10, 0);
  });

  it("calls onClose on Cancel", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <EditClockDialog {...defaultProps} />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
