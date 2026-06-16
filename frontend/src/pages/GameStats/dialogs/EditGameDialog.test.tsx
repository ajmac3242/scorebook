import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render } from "../../../test-utils";
import { EditGameDialog } from "./EditGameDialog";
import userEvent from "@testing-library/user-event";

describe("EditGameDialog", () => {
  const mockActions = {
    editOpponent: "Opponent Team",
    setEditOpponent: vi.fn(),
    editOpponentLogoUrl: "http://logo.com",
    setEditOpponentLogoUrl: vi.fn(),
    editDate: "2024-01-01",
    setEditDate: vi.fn(),
    editTime: "10:00",
    setEditTime: vi.fn(),
    editLocation: "Home Stadium",
    setEditLocation: vi.fn(),
    handleUpdateGame: vi.fn(),
    setIsDeleteDialogOpen: vi.fn(),
  } as any;

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    actions: mockActions,
  };

  it("should render with initial values", () => {
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    expect(getByLabelText("Opponent")).toHaveValue("Opponent Team");
    expect(getByLabelText("Opponent Logo URL")).toHaveValue("http://logo.com");
    expect(getByLabelText("Date")).toHaveValue("2024-01-01");
    expect(getByLabelText("Time")).toHaveValue("10:00");
    expect(getByLabelText("Location")).toHaveValue("Home Stadium");
  });

  it("should call setEditOpponent when opponent changes", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    const input = getByLabelText("Opponent");
    await user.type(input, "!");
    expect(mockActions.setEditOpponent).toHaveBeenCalled();
  });

  it("should call handleUpdateGame when Save is clicked", async () => {
    const user = userEvent.setup();
    const { getByText } = render(<EditGameDialog {...defaultProps} />);

    await user.click(getByText("Save"));
    expect(mockActions.handleUpdateGame).toHaveBeenCalled();
  });

  it("should call onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { getByText } = render(<EditGameDialog {...defaultProps} />);

    await user.click(getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call setEditOpponentLogoUrl when opponent logo url changes", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    const input = getByLabelText("Opponent Logo URL");
    await user.type(input, "!");
    expect(mockActions.setEditOpponentLogoUrl).toHaveBeenCalled();
  });

  it("should call setEditDate when date changes", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    const input = getByLabelText("Date");
    await user.clear(input);
    await user.type(input, "2024-02-02");
    expect(mockActions.setEditDate).toHaveBeenCalled();
  });

  it("should call setEditTime when time changes", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    const input = getByLabelText("Time");
    await user.clear(input);
    await user.type(input, "12:00");
    expect(mockActions.setEditTime).toHaveBeenCalled();
  });

  it("should call setEditLocation when location changes", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    const input = getByLabelText("Location");
    await user.type(input, "!");
    expect(mockActions.setEditLocation).toHaveBeenCalled();
  });

  it("should open delete confirmation when delete icon is clicked", async () => {
    const user = userEvent.setup();
    const { getByLabelText } = render(<EditGameDialog {...defaultProps} />);

    await user.click(getByLabelText("Delete game"));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockActions.setIsDeleteDialogOpen).toHaveBeenCalledWith(true);
  });
});
