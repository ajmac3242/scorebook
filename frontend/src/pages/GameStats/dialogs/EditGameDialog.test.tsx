import React from "react";
import {
  renderWithProviders as render,
  screen,
  act,
} from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditGameDialog } from "./EditGameDialog";
import { fireEvent } from "../../../test-utils";

describe("EditGameDialog", () => {
  const mockActions = {
    editOpponent: "Bulls",
    setEditOpponent: vi.fn(),
    editOpponentLogoUrl: "http://logo.com",
    setEditOpponentLogoUrl: vi.fn(),
    editDate: "2024-01-01",
    setEditDate: vi.fn(),
    editTime: "19:00",
    setEditTime: vi.fn(),
    editLocation: "United Center",
    setEditLocation: vi.fn(),
    handleUpdateGame: vi.fn(),
    setIsDeleteDialogOpen: vi.fn(),
  } as any;

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    actions: mockActions,
  };

  it("renders correctly", async () => {
    await act(async () => {
      render(<EditGameDialog {...defaultProps} />);
    });
    expect(screen.getByText("Edit Game Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Opponent")).toHaveValue("Bulls");
    expect(screen.getByLabelText("Location")).toHaveValue("United Center");
  });

  it("calls field setters on change", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<EditGameDialog {...defaultProps} />);
    });

    await user.type(screen.getByLabelText("Opponent"), "2");
    expect(mockActions.setEditOpponent).toHaveBeenCalled();

    await user.type(screen.getByLabelText("Location"), "2");
    expect(mockActions.setEditLocation).toHaveBeenCalled();

    // Test Date/Time fields - use fireEvent for HTML5 inputs in happy-dom if userEvent fails
    const dateInput = screen.getByLabelText("Date");
    fireEvent.change(dateInput, { target: { value: "2024-02-02" } });
    expect(mockActions.setEditDate).toHaveBeenCalledWith("2024-02-02");

    const timeInput = screen.getByLabelText("Time");
    fireEvent.change(timeInput, { target: { value: "20:00" } });
    expect(mockActions.setEditTime).toHaveBeenCalledWith("20:00");
  });

  it("calls handleUpdateGame when Save is clicked", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<EditGameDialog {...defaultProps} />);
    });

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mockActions.handleUpdateGame).toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<EditGameDialog {...defaultProps} />);
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("triggers delete request", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<EditGameDialog {...defaultProps} />);
    });

    await user.click(screen.getByLabelText("Delete game"));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockActions.setIsDeleteDialogOpen).toHaveBeenCalledWith(true);
  });
});
