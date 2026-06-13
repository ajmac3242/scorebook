import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("calls setEditName when name changes", async () => {
    const user = userEvent.setup();
    let currentName = "Lakers";
    const setEditName = vi.fn((val) => {
      currentName = val;
    });

    const { rerender } = render(
      <TeamSettingsDialog
        {...defaultProps}
        editName={currentName}
        setEditName={setEditName}
      />,
    );
    const input = screen.getByLabelText("Team name");

    await user.clear(input);
    rerender(
      <TeamSettingsDialog
        {...defaultProps}
        editName={currentName}
        setEditName={setEditName}
      />,
    );

    for (const char of "Clippers") {
      await user.type(input, char);
      rerender(
        <TeamSettingsDialog
          {...defaultProps}
          editName={currentName}
          setEditName={setEditName}
        />,
      );
    }

    expect(setEditName).toHaveBeenLastCalledWith("Clippers");
  });

  it("calls onDeleteRequest when delete icon is clicked", async () => {
    const user = userEvent.setup();
    render(<TeamSettingsDialog {...defaultProps} />);
    const deleteBtn = screen.getByLabelText("delete team");
    await user.click(deleteBtn);
    expect(defaultProps.onDeleteRequest).toHaveBeenCalled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<TeamSettingsDialog {...defaultProps} />);
    await user.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave when save is clicked", async () => {
    const user = userEvent.setup();
    render(<TeamSettingsDialog {...defaultProps} />);
    await user.click(screen.getByText("Save"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it("adds a play when 'Add' is clicked", async () => {
    const user = userEvent.setup();
    const props = { ...defaultProps, newPlayName: "Flare" };
    render(<TeamSettingsDialog {...props} />);
    await user.click(screen.getByText("Add"));
    expect(defaultProps.setEditPlaybook).toHaveBeenCalled();
    expect(defaultProps.setNewPlayName).toHaveBeenCalledWith("");
  });

  it("updates settings fields", async () => {
    const user = userEvent.setup();
    let currentLogoUrl = "";
    let currentPeriodLength = 12;
    let currentOtLength = 5;

    const setEditLogoUrl = vi.fn((val) => {
      currentLogoUrl = val;
    });
    const setEditPeriodLength = vi.fn((val) => {
      currentPeriodLength = val;
    });
    const setEditOvertimeLength = vi.fn((val) => {
      currentOtLength = val;
    });

    const { rerender } = render(
      <TeamSettingsDialog
        {...defaultProps}
        editLogoUrl={currentLogoUrl}
        setEditLogoUrl={setEditLogoUrl}
        editPeriodLength={currentPeriodLength}
        setEditPeriodLength={setEditPeriodLength}
        editOvertimeLength={currentOtLength}
        setEditOvertimeLength={setEditOvertimeLength}
      />,
    );

    const logoInput = screen.getByLabelText("Logo URL");
    for (const char of "logo.png") {
      await user.type(logoInput, char);
      rerender(
        <TeamSettingsDialog
          {...defaultProps}
          editLogoUrl={currentLogoUrl}
          setEditLogoUrl={setEditLogoUrl}
          editPeriodLength={currentPeriodLength}
          setEditPeriodLength={setEditPeriodLength}
          editOvertimeLength={currentOtLength}
          setEditOvertimeLength={setEditOvertimeLength}
        />,
      );
    }
    expect(setEditLogoUrl).toHaveBeenLastCalledWith("logo.png");

    const periodLengthInput = screen.getByLabelText(/Period length/i);
    await user.clear(periodLengthInput);
    rerender(
      <TeamSettingsDialog
        {...defaultProps}
        editLogoUrl={currentLogoUrl}
        setEditLogoUrl={setEditLogoUrl}
        editPeriodLength={currentPeriodLength}
        setEditPeriodLength={setEditPeriodLength}
        editOvertimeLength={currentOtLength}
        setEditOvertimeLength={setEditOvertimeLength}
      />,
    );
    for (const char of "10") {
      await user.type(periodLengthInput, char);
      rerender(
        <TeamSettingsDialog
          {...defaultProps}
          editLogoUrl={currentLogoUrl}
          setEditLogoUrl={setEditLogoUrl}
          editPeriodLength={currentPeriodLength}
          setEditPeriodLength={setEditPeriodLength}
          editOvertimeLength={currentOtLength}
          setEditOvertimeLength={setEditOvertimeLength}
        />,
      );
    }
    expect(setEditPeriodLength).toHaveBeenLastCalledWith(10);

    const otLengthInput = screen.getByLabelText(/OT length/i);
    await user.clear(otLengthInput);
    rerender(
      <TeamSettingsDialog
        {...defaultProps}
        editLogoUrl={currentLogoUrl}
        setEditLogoUrl={setEditLogoUrl}
        editPeriodLength={currentPeriodLength}
        setEditPeriodLength={setEditPeriodLength}
        editOvertimeLength={currentOtLength}
        setEditOvertimeLength={setEditOvertimeLength}
      />,
    );
    for (const char of "3") {
      await user.type(otLengthInput, char);
      rerender(
        <TeamSettingsDialog
          {...defaultProps}
          editLogoUrl={currentLogoUrl}
          setEditLogoUrl={setEditLogoUrl}
          editPeriodLength={currentPeriodLength}
          setEditPeriodLength={setEditPeriodLength}
          editOvertimeLength={currentOtLength}
          setEditOvertimeLength={setEditOvertimeLength}
        />,
      );
    }
    expect(setEditOvertimeLength).toHaveBeenLastCalledWith(3);
  });
});
