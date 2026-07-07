import React from "react";
import { render, screen, assertAccessible } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AvatarColorPicker from "./AvatarColorPicker";
import { describe, it, expect, vi } from "vitest";

describe("AvatarColorPicker", () => {
  const colors = ["#ff0000", "#00ff00", "#0000ff"];
  const onChange = vi.fn();

  it("renders all color options", () => {
    const selectedColor = colors[0];
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );

    colors.forEach((color) => {
      expect(
        screen.getByLabelText(`Select color ${color}`),
      ).toBeInTheDocument();
    });
  });

  it("shows check icon on selected color", () => {
    const selectedColor = colors[0];
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );

    const selected = screen.getByLabelText(`Select color ${selectedColor}`);
    expect(selected).toHaveAttribute("aria-checked", "true");

    // Check for the presence of the SVG (CheckIcon)
    const checkIcon = selected.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("calls onChange when a color is clicked", async () => {
    const user = userEvent.setup();
    const selectedColor = colors[0];
    const nextColor = colors[1];
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText(`Select color ${nextColor}`));
    expect(onChange).toHaveBeenCalledWith(nextColor);
  });

  it("calls onChange when Enter key is pressed on a color", async () => {
    const user = userEvent.setup();
    const selectedColor = colors[0];
    const nextColor = colors[2];
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );

    const colorOption = screen.getByLabelText(`Select color ${nextColor}`);
    colorOption.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(nextColor);
  });

  it("calls onChange when Space key is pressed on a color", async () => {
    const user = userEvent.setup();
    const selectedColor = colors[0];
    const nextColor = colors[1];
    render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );

    const colorOption = screen.getByLabelText(`Select color ${nextColor}`);
    colorOption.focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(nextColor);
  });

  it("has no accessibility violations", async () => {
    const selectedColor = colors[0];
    const { container } = render(
      <AvatarColorPicker
        colors={colors}
        selectedColor={selectedColor}
        onChange={onChange}
      />,
    );
    await assertAccessible(container);
  });
});
