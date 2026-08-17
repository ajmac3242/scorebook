import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../test-utils";
import { CourtSightThemeProvider, useAppTheme } from "./ThemeContext";

describe("ThemeContext", () => {
  const STORAGE_KEY = "courtsight_preset_id";

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when useAppTheme is used outside CourtSightThemeProvider", () => {
    expect(() => renderHook(() => useAppTheme())).toThrow(
      "useAppTheme must be used inside CourtSightThemeProvider",
    );
  });

  it("throws error if CourtSightThemeProvider is given empty presets list", () => {
    expect(() =>
      render(
        <CourtSightThemeProvider presets={[]}>
          <div>Child</div>
        </CourtSightThemeProvider>,
        { withAuth: false },
      ),
    ).toThrow("CourtSightThemeProvider requires at least one preset");
  });

  it("provides active preset and theme context value", () => {
    function TestConsumer() {
      const { presetId, activePreset } = useAppTheme();
      return (
        <div>
          <span data-testid="preset-id">{presetId}</span>
          <span data-testid="preset-name">{activePreset.label}</span>
        </div>
      );
    }

    render(
      <CourtSightThemeProvider>
        <TestConsumer />
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    expect(screen.getByTestId("preset-id").textContent).toBe("gametime");
    expect(screen.getByTestId("preset-name").textContent).toBe("Gametime");
  });

  it("changes preset and updates localStorage on setPresetId call", async () => {
    const user = userEvent.setup();

    function TestConsumer() {
      const { presetId, setPresetId } = useAppTheme();
      return (
        <div>
          <span data-testid="preset-id">{presetId}</span>
          <button onClick={() => setPresetId("classic")}>Set Classic</button>
        </div>
      );
    }

    render(
      <CourtSightThemeProvider>
        <TestConsumer />
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    expect(screen.getByTestId("preset-id").textContent).toBe("gametime");

    await user.click(screen.getByText("Set Classic"));

    expect(screen.getByTestId("preset-id").textContent).toBe("classic");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("classic");
  });

  it("falls back to default preset id if setPresetId receives an invalid preset id", async () => {
    const user = userEvent.setup();

    function TestConsumer() {
      const { presetId, setPresetId } = useAppTheme();
      return (
        <div>
          <span data-testid="preset-id">{presetId}</span>
          <button onClick={() => setPresetId("non-existent-preset")}>
            Set Invalid
          </button>
        </div>
      );
    }

    render(
      <CourtSightThemeProvider defaultPresetId="gametime">
        <TestConsumer />
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    await user.click(screen.getByText("Set Invalid"));

    expect(screen.getByTestId("preset-id").textContent).toBe("gametime");
  });

  it("loads stored preset from localStorage on initial render", () => {
    localStorage.setItem(STORAGE_KEY, "blacktop");

    function TestConsumer() {
      const { presetId } = useAppTheme();
      return <span data-testid="preset-id">{presetId}</span>;
    }

    render(
      <CourtSightThemeProvider>
        <TestConsumer />
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    expect(screen.getByTestId("preset-id").textContent).toBe("blacktop");
  });

  it("handles localStorage.getItem and setItem throwing errors gracefully", async () => {
    const user = userEvent.setup();

    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const setItemSpy = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

    function TestConsumer() {
      const { presetId, setPresetId } = useAppTheme();
      return (
        <div>
          <span data-testid="preset-id">{presetId}</span>
          <button onClick={() => setPresetId("classic")}>Set Classic</button>
        </div>
      );
    }

    render(
      <CourtSightThemeProvider>
        <TestConsumer />
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    expect(screen.getByTestId("preset-id").textContent).toBe("gametime");

    await user.click(screen.getByText("Set Classic"));

    expect(screen.getByTestId("preset-id").textContent).toBe("classic");
    expect(setItemSpy).toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CourtSightThemeProvider>
        <div>CourtSight Content</div>
      </CourtSightThemeProvider>,
      { withAuth: false },
    );

    await assertAccessible(container);
  });
});
