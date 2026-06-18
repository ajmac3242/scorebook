/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { renderWithProviders as render, screen, fireEvent } from "../../../../test-utils";
import { describe, it, expect, vi } from "vitest";
import TeamSettingsDialog from "../TeamSettingsDialog";

// Mock useTokens hook
vi.mock("../../../theme/useTokens", () => ({
  useTokens: () => ({
    semantic: {
      shape: {
        radius: {
          md: 8,
        },
      },
    },
  }),
}));

describe("TeamSettingsDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDeleteRequest: vi.fn(),
    editName: "Lakers",
    setEditName: vi.fn(),
    editLogoUrl: "",
    setEditLogoUrl: vi.fn(),
    editColor: "#000000",
    setEditColor: vi.fn(),
    editPeriodType: "QUARTERS" as const,
    setEditPeriodType: vi.fn(),
    editPeriodLength: 12,
    setEditPeriodLength: vi.fn(),
    editOvertimeLength: 5,
    setEditOvertimeLength: vi.fn(),
    editMaxStintDuration: 10,
    setEditMaxStintDuration: vi.fn(),
    editTimeoutLimit: 7,
    setEditTimeoutLimit: vi.fn(),
    editFoulLimit: 6,
    setEditFoulLimit: vi.fn(),
    editFoulWarningThresholds: { P1: 2 },
    setEditFoulWarningThresholds: vi.fn(),
    editPlaybook: ["Horns", "Elevator"],
    setEditPlaybook: vi.fn(),
    newPlayName: "",
    setNewPlayName: vi.fn(),
    tokens: {
      semantic: {
        shape: {
          radius: {
            md: 8,
          },
        },
      },
    } as any,
  };

  it("renders correctly when open", () => {
    render(<TeamSettingsDialog {...defaultProps} />);
    expect(screen.getByText("Edit team details")).toBeDefined();
    expect(screen.getByLabelText("Team name")).toBeDefined();
    expect(screen.getByText("Horns")).toBeDefined();
    expect(screen.getByText("Elevator")).toBeDefined();
  });

  it("calls setEditName when name changes", () => {
    render(<TeamSettingsDialog {...defaultProps} />);
    const input = screen.getByLabelText("Team name");
    fireEvent.change(input, { target: { value: "Clippers" } });
    expect(defaultProps.setEditName).toHaveBeenCalledWith("Clippers");
  });

  it("calls onDeleteRequest when delete icon is clicked", () => {
    render(<TeamSettingsDialog {...defaultProps} />);
    const deleteBtn = screen.getByLabelText("delete team");
    fireEvent.click(deleteBtn);
    expect(defaultProps.onDeleteRequest).toHaveBeenCalled();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<TeamSettingsDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave when save is clicked", () => {
    render(<TeamSettingsDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Save"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it("adds a play when 'Add' is clicked", () => {
    const props = { ...defaultProps, newPlayName: "Flare" };
    render(<TeamSettingsDialog {...props} />);
    fireEvent.click(screen.getByText("Add"));
    expect(defaultProps.setEditPlaybook).toHaveBeenCalled();
    expect(defaultProps.setNewPlayName).toHaveBeenCalledWith("");
  });

  it("updates settings fields", () => {
    render(<TeamSettingsDialog {...defaultProps} />);

    const logoInput = screen.getByLabelText("Logo URL");
    fireEvent.change(logoInput, { target: { value: "logo.png" } });
    expect(defaultProps.setEditLogoUrl).toHaveBeenCalledWith("logo.png");

    const periodLengthInput = screen.getByLabelText(/Period length/i);
    fireEvent.change(periodLengthInput, { target: { value: "10" } });
    expect(defaultProps.setEditPeriodLength).toHaveBeenCalledWith(10);

    const otLengthInput = screen.getByLabelText(/OT length/i);
    fireEvent.change(otLengthInput, { target: { value: "3" } });
    expect(defaultProps.setEditOvertimeLength).toHaveBeenCalledWith(3);
  });
});
