
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

  it("calls setRosterSearchTerm when search input changes", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("Search players");
    fireEvent.change(input, { target: { value: "LeBron" } });
    expect(defaultProps.setRosterSearchTerm).toHaveBeenCalledWith("LeBron");
  });

  it("calls onStageChange when Add is clicked", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);
    expect(defaultProps.onStageChange).toHaveBeenCalledWith("p2", false);
  });

  it("calls onStageChange when remove is clicked", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    const removeBtn = screen.getByLabelText("remove LeBron James");
    fireEvent.click(removeBtn);
    expect(defaultProps.onStageChange).toHaveBeenCalledWith("p1", true);
  });

  it("calls onStageJerseyUpdate when jersey changes", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    const jerseyInput = screen.getByLabelText("#");
    fireEvent.change(jerseyInput, { target: { value: "6" } });
    expect(defaultProps.onStageJerseyUpdate).toHaveBeenCalledWith("p1", "6");
  });

  it("calls onSave when save is clicked", () => {
    render(<ManageRosterDialog {...defaultProps} />);
    fireEvent.click(screen.getByText("Save changes"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });
});
