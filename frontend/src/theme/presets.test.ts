import { describe, it, expect } from "vitest";
import PRESETS, { DEFAULT_PRESET_ID } from "./presets";

describe("Theme Presets", () => {
  it("contains all expected default presets", () => {
    expect(PRESETS).toBeDefined();
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);

    const presetIds = PRESETS.map((p) => p.id);
    expect(presetIds).toContain("classic");
    expect(presetIds).toContain("gametime");
    expect(presetIds).toContain("hardwood");
    expect(presetIds).toContain("leather");
    expect(presetIds).toContain("blacktop");
  });

  it("has a valid default preset ID that exists in PRESETS", () => {
    const defaultPreset = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    expect(defaultPreset).toBeDefined();
    expect(defaultPreset?.label).toBe("Gametime");
  });

  it("defines well-formed token overrides for each preset", () => {
    PRESETS.forEach((preset) => {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.previewColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["dark", "light"]).toContain(preset.mode);

      const colorOverrides = preset.overrides?.semantic?.color;
      expect(colorOverrides).toBeDefined();
      expect(colorOverrides?.brand?.primary?.main).toBeTruthy();
      expect(colorOverrides?.background?.default).toBeTruthy();
      expect(colorOverrides?.text?.primary).toBeTruthy();
      expect(colorOverrides?.border?.default).toBeTruthy();
      expect(colorOverrides?.action?.hover).toBeTruthy();
    });
  });
});
