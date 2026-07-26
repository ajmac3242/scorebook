import React from "react";
import { renderWithProviders as render, screen, assertAccessible } from "../../../test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OpponentJerseyPicker } from "./OpponentJerseyPicker";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";

describe("OpponentJerseyPicker", () => {
  const defaultProps = {
    selectedPlayerId: null,
    setSelectedPlayerId: vi.fn(),
  };

  it("renders all jersey number options as buttons", async () => {
    const { container } = render(
      <OpponentJerseyPicker {...defaultProps} />,
      { withAuth: false }
    );

    // Verify some expected jersey buttons exist
    expect(screen.getByRole("button", { name: "0" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "23" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "35" })).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("highlights the currently selected jersey button with contained variant", () => {
    render(
      <OpponentJerseyPicker
        selectedPlayerId={`${SPECIAL_PLAYER_IDS.OPPONENT}:23`}
        setSelectedPlayerId={vi.fn()}
      />,
      { withAuth: false }
    );

    const button23 = screen.getByRole("button", { name: "23" });
    const button0 = screen.getByRole("button", { name: "0" });

    // Contained variant corresponds to the standard MUI variant="contained"
    expect(button23).toHaveClass("MuiButton-contained");
    expect(button0).toHaveClass("MuiButton-outlined");
  });

  it("calls setSelectedPlayerId with specific opponent player id when clicking an unselected jersey", async () => {
    const user = userEvent.setup();
    const setSelectedPlayerId = vi.fn();

    render(
      <OpponentJerseyPicker
        selectedPlayerId={null}
        setSelectedPlayerId={setSelectedPlayerId}
      />,
      { withAuth: false }
    );

    const button23 = screen.getByRole("button", { name: "23" });
    await user.click(button23);

    expect(setSelectedPlayerId).toHaveBeenCalledWith(`${SPECIAL_PLAYER_IDS.OPPONENT}:23`);
  });

  it("toggles back to general opponent when clicking an already selected jersey button", async () => {
    const user = userEvent.setup();
    const setSelectedPlayerId = vi.fn();

    render(
      <OpponentJerseyPicker
        selectedPlayerId={`${SPECIAL_PLAYER_IDS.OPPONENT}:23`}
        setSelectedPlayerId={setSelectedPlayerId}
      />,
      { withAuth: false }
    );

    const button23 = screen.getByRole("button", { name: "23" });
    await user.click(button23);

    expect(setSelectedPlayerId).toHaveBeenCalledWith(SPECIAL_PLAYER_IDS.OPPONENT);
  });
});
