import { describe, expect, it, vi } from "vitest";
import {
  screen,
  renderWithProviders,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import ThemePresetCard from "./ThemePresetCard";
import { ThemePreset } from "../../theme/ThemeContext";

describe("ThemePresetCard", () => {
  const mockPreset: ThemePreset = {
    id: "midnight",
    label: "Midnight Navy",
    mode: "dark",
    primary: "#1e293b",
    secondary: "#38bdf8",
    previewColor: "#0f172a",
  };

  it("renders preset label, mode, and handles click selection", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    const { container } = renderWithProviders(
      <ThemePresetCard
        preset={mockPreset}
        selected={false}
        onSelect={handleSelect}
      />,
    );

    expect(screen.getByText("Midnight Navy")).toBeInTheDocument();
    expect(screen.getByText("dark")).toBeInTheDocument();

    const cardButton = screen.getByRole("button", {
      name: /Midnight Navy dark/i,
    });
    expect(cardButton).toHaveAttribute("aria-pressed", "false");

    await user.click(cardButton);
    expect(handleSelect).toHaveBeenCalledTimes(1);

    await assertAccessible(container);
  });

  it("renders selected state with check indicator and aria-pressed true", async () => {
    const handleSelect = vi.fn();

    const { container } = renderWithProviders(
      <ThemePresetCard
        preset={mockPreset}
        selected={true}
        onSelect={handleSelect}
      />,
    );

    const cardButton = screen.getByRole("button", {
      name: /Midnight Navy dark/i,
    });
    expect(cardButton).toHaveAttribute("aria-pressed", "true");

    await assertAccessible(container);
  });
});
