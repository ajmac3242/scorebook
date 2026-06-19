/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  renderWithProviders as render,
  screen,
} from "../../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ManageRosterDialog from "../ManageRosterDialog";

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

// Mock getInitials
vi.mock("../../../utils/stats", () => ({
  getInitials: (name: string) => name.charAt(0),
}));

describe("ManageRosterDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    allPlayers: [
      { id: "p1", name: "LeBron James", avatarColor: "purple" },
      { id: "p2", name: "Anthony Davis", avatarColor: "gold" },
    ],
    teamPlayers: [{ teamId: "t1", playerId: "p1", jerseyNumber: "23" }],
    pendingRosterChanges: {},
    localJerseyNumbers: {},
    rosterSearchTerm: "",
    setRosterSearchTerm: vi.fn(),
    onStageChange: vi.fn(),
    onStageJerseyUpdate: vi.fn(),
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

  it("renders correctly", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    expect(screen.getByText("Manage team roster")).toBeDefined();
    expect(screen.getByText("LeBron James")).toBeDefined();
    expect(screen.getByText("Anthony Davis")).toBeDefined();
  });

  it("calls setRosterSearchTerm when search input changes", async () => {
    const user = userEvent.setup();
    const setRosterSearchTerm = vi.fn();

    const TestWrapper = () => {
      const [val, setVal] = React.useState("");
      return (
        <ManageRosterDialog
          {...defaultProps}
          rosterSearchTerm={val}
          setRosterSearchTerm={(newVal) => {
            setVal(newVal);
            setRosterSearchTerm(newVal);
          }}
        />
      );
    };

    render(<TestWrapper />);
    const input = screen.getByPlaceholderText("Search players");
    await user.type(input, "LeBron");
    expect(setRosterSearchTerm).toHaveBeenLastCalledWith("LeBron");
  });

  it("calls onStageChange when Add is clicked", async () => {
    const user = userEvent.setup();
    render(<ManageRosterDialog {...defaultProps} />);
    const addButtons = screen.getAllByText("Add");
    await user.click(addButtons[0]);
    expect(defaultProps.onStageChange).toHaveBeenCalledWith("p2", false);
  });

  it("calls onStageChange when remove is clicked", async () => {
    const user = userEvent.setup();
    render(<ManageRosterDialog {...defaultProps} />);
    const removeBtn = screen.getByLabelText("remove LeBron James");
    await user.click(removeBtn);
    expect(defaultProps.onStageChange).toHaveBeenCalledWith("p1", true);
  });

  it("calls onStageJerseyUpdate when jersey changes", async () => {
    const user = userEvent.setup();

    const TestWrapper = () => {
      const [val, setVal] = React.useState("23");
      return (
        <ManageRosterDialog
          {...defaultProps}
          localJerseyNumbers={{ p1: val }}
          onStageJerseyUpdate={(id, newJersey) => {
            setVal(newJersey);
            defaultProps.onStageJerseyUpdate(id, newJersey);
          }}
        />
      );
    };

    render(<TestWrapper />);
    const jerseyInput = screen.getByLabelText("#");
    await user.clear(jerseyInput);
    await user.type(jerseyInput, "6");
    expect(defaultProps.onStageJerseyUpdate).toHaveBeenLastCalledWith("p1", "6");
  });

  it("calls onSave when save is clicked", async () => {
    const user = userEvent.setup();
    render(<ManageRosterDialog {...defaultProps} />);
    await user.click(screen.getByText("Save changes"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });
});
