import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import SettingsRow from "./SettingsRow";
import { Button } from "@mui/material";

describe("SettingsRow", () => {
  it("renders label and control correctly", () => {
    render(
      <SettingsRow
        label="Theme Setting"
        control={<Button>Toggle Theme</Button>}
      />
    );

    expect(screen.getByText("Theme Setting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle Theme" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingsRow
        label="Notifications"
        description="Enable push notifications for game events"
        control={<Button>Enable</Button>}
      />
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(
      screen.getByText("Enable push notifications for game events")
    ).toBeInTheDocument();
  });

  it("handles button interaction within control", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <SettingsRow
        label="Action Setting"
        control={<Button onClick={handleClick}>Action</Button>}
      />
    );

    await user.click(screen.getByRole("button", { name: "Action" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SettingsRow
        label="Accessible Setting"
        description="Settings description text"
        control={<Button>Save</Button>}
      />
    );

    await assertAccessible(container);
  });
});
