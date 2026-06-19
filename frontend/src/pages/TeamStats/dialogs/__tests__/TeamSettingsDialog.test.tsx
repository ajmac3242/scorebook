import React from "react";
import { renderWithProviders as render, screen } from "../../../../test-utils";
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
    const setEditName = vi.fn();
    const TestWrapper = () => {
      const [val, setVal] = React.useState("Lakers");
      return (
        <TeamSettingsDialog
          {...defaultProps}
          editName={val}
          setEditName={(v) => {
            setVal(v);
            setEditName(v);
          }}
        />
      );
    };
    render(<TestWrapper />);
    const input = screen.getByLabelText("Team name");
    await user.clear(input);
    await user.type(input, "Clippers");
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
    const setEditLogoUrl = vi.fn();
    const setEditPeriodLength = vi.fn();
    const setEditOvertimeLength = vi.fn();

    const TestWrapper = () => {
      const [logo, setLogo] = React.useState("");
      const [pl, setPl] = React.useState(12);
      const [ot, setOt] = React.useState(5);
      return (
        <TeamSettingsDialog
          {...defaultProps}
          editLogoUrl={logo}
          setEditLogoUrl={(v) => {
            setLogo(v);
            setEditLogoUrl(v);
          }}
          editPeriodLength={pl}
          setEditPeriodLength={(v) => {
            setPl(v);
            setEditPeriodLength(v);
          }}
          editOvertimeLength={ot}
          setEditOvertimeLength={(v) => {
            setOt(v);
            setEditOvertimeLength(v);
          }}
        />
      );
    };

    render(<TestWrapper />);

    const logoInput = screen.getByLabelText("Logo URL");
    await user.type(logoInput, "logo.png");
    expect(setEditLogoUrl).toHaveBeenLastCalledWith("logo.png");

    const periodLengthInput = screen.getByLabelText(/Period length/i);
    await user.clear(periodLengthInput);
    await user.type(periodLengthInput, "10");
    expect(setEditPeriodLength).toHaveBeenLastCalledWith(10);

    const otLengthInput = screen.getByLabelText(/OT length/i);
    await user.clear(otLengthInput);
    await user.type(otLengthInput, "3");
    expect(setEditOvertimeLength).toHaveBeenLastCalledWith(3);
  });
});
