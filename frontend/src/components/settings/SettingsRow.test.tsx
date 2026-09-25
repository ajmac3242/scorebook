import React from "react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import SettingsRow from "./SettingsRow";
import { Button } from "@mui/material";
import * as useTokensModule from "../../theme/useTokens";

describe("SettingsRow", () => {
  it("renders label and control correctly", () => {
    render(
      <SettingsRow
        label="Theme Setting"
        control={<Button>Toggle Theme</Button>}
      />,
    );

    expect(screen.getByText("Theme Setting")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle Theme" }),
    ).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingsRow
        label="Notifications"
        description="Enable push notifications for game events"
        control={<Button>Enable</Button>}
      />,
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(
      screen.getByText("Enable push notifications for game events"),
    ).toBeInTheDocument();
  });

  it("handles button interaction within control", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <SettingsRow
        label="Action Setting"
        control={<Button onClick={handleClick}>Action</Button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Action" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders without divider when noDivider is true", () => {
    const { container } = render(
      <SettingsRow
        label="No Divider Setting"
        noDivider={true}
        control={<Button>Action</Button>}
      />,
    );

    expect(container.querySelector("hr")).not.toBeInTheDocument();
  });

  it("renders divider by default when noDivider is omitted or false", () => {
    const { container } = render(
      <SettingsRow
        label="Divider Setting"
        noDivider={false}
        control={<Button>Action</Button>}
      />,
    );

    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("uses fallback token values when formRow tokens are undefined", () => {
    const spy = vi.spyOn(useTokensModule, "useTokens").mockReturnValue({
      layout: {},
      typography: { fontWeight: { semibold: 600 } },
      semantic: {
        spacing: { md: 16, xs: 4 },
        color: {
          text: { primary: "#000", secondary: "#666" },
          border: { subtle: "#ccc" },
        },
      },
    } as any);

    render(
      <SettingsRow
        label="Fallback Tokens Setting"
        description="Fallback description"
        control={<Button>Action</Button>}
      />,
    );

    expect(screen.getByText("Fallback Tokens Setting")).toBeInTheDocument();
    expect(screen.getByText("Fallback description")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SettingsRow
        label="Accessible Setting"
        description="Settings description text"
        control={<Button>Save</Button>}
      />,
    );

    await assertAccessible(container);
  });
});
