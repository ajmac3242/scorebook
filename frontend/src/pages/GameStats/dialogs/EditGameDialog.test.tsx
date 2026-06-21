import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { EditGameDialog } from "./EditGameDialog";
import { renderWithProviders, assertAccessible } from "../../../test-utils";

import { useState } from "react";

describe("EditGameDialog", () => {
  const mockActions = {
    editOpponent: "Lakers",
    setEditOpponent: vi.fn(),
    editOpponentLogoUrl: "http://logo.com",
    setEditOpponentLogoUrl: vi.fn(),
    editDate: "2024-06-21",
    setEditDate: vi.fn(),
    editTime: "19:00",
    setEditTime: vi.fn(),
    editLocation: "Staples Center",
    setEditLocation: vi.fn(),
    handleUpdateGame: vi.fn(),
    setIsDeleteDialogOpen: vi.fn(),
  } as any;

  const TestWrapper = ({
    actionsOverrides = {},
    onClose = vi.fn(),
  }: {
    actionsOverrides?: any;
    onClose?: () => void;
  }) => {
    const [opponent, setOpponent] = useState("Lakers");
    const [logo, setLogo] = useState("http://logo.com");
    const [date, setDate] = useState("2024-06-21");
    const [time, setTime] = useState("19:00");
    const [loc, setLoc] = useState("Staples Center");

    const actions = {
      ...mockActions,
      editOpponent: opponent,
      setEditOpponent: (val: string) => {
        setOpponent(val);
        mockActions.setEditOpponent(val);
      },
      editOpponentLogoUrl: logo,
      setEditOpponentLogoUrl: (val: string) => {
        setLogo(val);
        mockActions.setEditOpponentLogoUrl(val);
      },
      editDate: date,
      setEditDate: (val: string) => {
        setDate(val);
        mockActions.setEditDate(val);
      },
      editTime: time,
      setEditTime: (val: string) => {
        setTime(val);
        mockActions.setEditTime(val);
      },
      editLocation: loc,
      setEditLocation: (val: string) => {
        setLoc(val);
        mockActions.setEditLocation(val);
      },
      ...actionsOverrides,
    };
    return <EditGameDialog open={true} onClose={onClose} actions={actions} />;
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    actions: mockActions,
  };

  it("renders with correct initial values", () => {
    renderWithProviders(<EditGameDialog {...defaultProps} />);

    expect(screen.getByLabelText(/^opponent$/i)).toHaveValue("Lakers");
    expect(screen.getByLabelText(/opponent logo url/i)).toHaveValue(
      "http://logo.com",
    );
    expect(screen.getByLabelText(/date/i)).toHaveValue("2024-06-21");
    expect(screen.getByLabelText(/time/i)).toHaveValue("19:00");
    expect(screen.getByLabelText(/location/i)).toHaveValue("Staples Center");
  });

  it("calls setEditOpponent when opponent changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);

    const input = screen.getByLabelText(/^opponent$/i);
    await user.clear(input);
    await user.type(input, "Celtics");

    expect(mockActions.setEditOpponent).toHaveBeenCalledWith("Celtics");
  });

  it("updates logo and location", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);

    const logoInput = screen.getByLabelText(/opponent logo url/i);
    await user.clear(logoInput);
    await user.type(logoInput, "newlogo.png");
    expect(mockActions.setEditOpponentLogoUrl).toHaveBeenCalledWith("newlogo.png");

    const dateInput = screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: "2024-12-25" } });
    expect(mockActions.setEditDate).toHaveBeenCalledWith("2024-12-25");

    const timeInput = screen.getByLabelText(/time/i);
    fireEvent.change(timeInput, { target: { value: "20:00" } });
    expect(mockActions.setEditTime).toHaveBeenCalledWith("20:00");

    const locInput = screen.getByLabelText(/location/i);
    await user.clear(locInput);
    await user.type(locInput, "Garden");
    expect(mockActions.setEditLocation).toHaveBeenCalledWith("Garden");
  });

  it("calls handleUpdateGame when Save is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditGameDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(mockActions.handleUpdateGame).toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditGameDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls setIsDeleteDialogOpen when delete icon is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditGameDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /delete game/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockActions.setIsDeleteDialogOpen).toHaveBeenCalledWith(true);
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithProviders(<EditGameDialog {...defaultProps} />);
    await assertAccessible(container);
  });
});
