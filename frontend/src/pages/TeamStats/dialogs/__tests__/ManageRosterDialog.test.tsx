import React from "react";
import { render, screen } from "@testing-library/react";
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
    let currentSearchTerm = "";
    const setRosterSearchTerm = vi.fn((val) => {
      currentSearchTerm = val;
    });

    const { rerender } = render(
      <ManageRosterDialog
        {...defaultProps}
        rosterSearchTerm={currentSearchTerm}
        setRosterSearchTerm={setRosterSearchTerm}
      />,
    );
    const input = screen.getByPlaceholderText("Search players");

    for (const char of "LeBron") {
      await user.type(input, char);
      rerender(
        <ManageRosterDialog
          {...defaultProps}
          rosterSearchTerm={currentSearchTerm}
          setRosterSearchTerm={setRosterSearchTerm}
        />,
      );
    }

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
    let currentJersey = "23";
    const onStageJerseyUpdate = vi.fn((_id, val) => {
      currentJersey = val;
    });

    const { rerender } = render(
      <ManageRosterDialog
        {...defaultProps}
        localJerseyNumbers={{ p1: currentJersey }}
        onStageJerseyUpdate={onStageJerseyUpdate}
      />,
    );
    const jerseyInput = screen.getByLabelText("#");

    await user.clear(jerseyInput);
    rerender(
      <ManageRosterDialog
        {...defaultProps}
        localJerseyNumbers={{ p1: currentJersey }}
        onStageJerseyUpdate={onStageJerseyUpdate}
      />,
    );

    for (const char of "6") {
      await user.type(jerseyInput, char);
      rerender(
        <ManageRosterDialog
          {...defaultProps}
          localJerseyNumbers={{ p1: currentJersey }}
          onStageJerseyUpdate={onStageJerseyUpdate}
        />,
      );
    }

    expect(onStageJerseyUpdate).toHaveBeenLastCalledWith("p1", "6");
  });

  it("calls onSave when save is clicked", async () => {
    const user = userEvent.setup();
    render(<ManageRosterDialog {...defaultProps} />);
    await user.click(screen.getByText("Save changes"));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });
});
