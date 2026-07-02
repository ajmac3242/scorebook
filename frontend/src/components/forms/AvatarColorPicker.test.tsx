import React from "react";
import { render, screen, assertAccessible } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AvatarColorPicker from "./AvatarColorPicker";
import { describe, it, expect, vi } from "vitest";

describe("AvatarColorPicker", () => {
  const colors = ["#ff0000", "#00ff00", "#0000ff"];
  const onChange = vi.fn();

  it("renders all color options", () => {
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );

    colors.forEach((color) => {
      expect(screen.getByLabelText(`Select color ${color}`)).toBeInTheDocument();
    });
  });

  it("shows check icon on selected color", () => {
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );

    const selected = screen.getByLabelText("Select color #ff0000");
    expect(selected).toHaveAttribute("aria-checked", "true");

    // Check for the presence of the SVG (CheckIcon)
    const checkIcon = selected.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("calls onChange when a color is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );

    await user.click(screen.getByLabelText("Select color #00ff00"));
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("calls onChange when Enter key is pressed on a color", async () => {
    const user = userEvent.setup();
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );

    const colorOption = screen.getByLabelText("Select color #0000ff");
    colorOption.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("#0000ff");
  });

  it("calls onChange when Space key is pressed on a color", async () => {
    const user = userEvent.setup();
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );

    const colorOption = screen.getByLabelText("Select color #00ff00");
    colorOption.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <AvatarColorPicker
        colors={colors}
        selectedColor="#ff0000"
        onChange={onChange}
      />
    );
    await assertAccessible(container);
  });
});
