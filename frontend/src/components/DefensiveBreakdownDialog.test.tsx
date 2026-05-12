import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DefensiveBreakdownDialog from "./DefensiveBreakdownDialog";
import React from "react";
import { BREAKDOWN_REASONS } from "../constants/stats";

describe("DefensiveBreakdownDialog", () => {
  const onClose = vi.fn();

  it("renders all breakdown reasons", () => {
    render(<DefensiveBreakdownDialog open={true} onClose={onClose} />);

    Object.values(BREAKDOWN_REASONS).forEach((reason) => {
      expect(screen.getByText(reason)).toBeDefined();
    });
  });

  it("calls onClose with the selected reason", () => {
    render(<DefensiveBreakdownDialog open={true} onClose={onClose} />);

    const reason = Object.values(BREAKDOWN_REASONS)[0];
    fireEvent.click(screen.getByText(reason));

    expect(onClose).toHaveBeenCalledWith(reason);
  });

  it("calls onClose without arguments when Skip is clicked", () => {
    render(<DefensiveBreakdownDialog open={true} onClose={onClose} />);

    fireEvent.click(screen.getByText("Skip / No Reason"));

    expect(onClose).toHaveBeenCalledWith();
  });
});
