import { describe, it, expect } from "vitest";
import { buildTheme, resolveTokens } from "./buildTheme";
import { tokens } from "./tokens/tokens";

describe("buildTheme.ts", () => {
  describe("resolveTokens", () => {
    it("returns default tokens when no preset is provided", () => {
      const resolved = resolveTokens();
      expect(resolved.semantic.color.text.primary).toBe(
        tokens.semantic.color.text.primary,
      );
    });

    it("injects dark semantic colors when preset mode is dark", () => {
      const resolved = resolveTokens({
        id: "dark-test",
        label: "Dark Test",
        previewColor: "#0E141B",
        mode: "dark",
      });
      expect(resolved.semantic.color.background.default).toBe("#0E141B");
    });

    it("applies custom token overrides from preset", () => {
      const resolved = resolveTokens({
        id: "custom-test",
        label: "Custom Test",
        previewColor: "#123456",
        mode: "light",
        overrides: {
          semantic: {
            color: {
              brand: {
                primary: {
                  main: "#123456",
                },
              },
            },
          },
        },
      });
      expect(resolved.semantic.color.brand.primary.main).toBe("#123456");
    });
  });

  describe("buildTheme", () => {
    it("builds an MUI Theme object with custom appTokens attached", () => {
      const theme = buildTheme();
      expect(theme).toBeDefined();
      expect(theme.appTokens).toBeDefined();
      expect(theme.components).toBeDefined();
    });

    it("configures component style overrides for MuiButton, MuiIconButton, and MuiPaper", () => {
      const theme = buildTheme({
        id: "dark-preset",
        label: "Dark Preset",
        previewColor: "#0E141B",
        mode: "dark",
      });

      expect(theme.components?.MuiButton).toBeDefined();
      expect(theme.components?.MuiIconButton).toBeDefined();
      expect(theme.components?.MuiCard).toBeDefined();
      expect(theme.components?.MuiPaper).toBeDefined();
      expect(theme.components?.MuiAppBar).toBeDefined();
      expect(theme.components?.MuiOutlinedInput).toBeDefined();
      expect(theme.components?.MuiDialog).toBeDefined();
      expect(theme.components?.MuiTooltip).toBeDefined();
    });
  });
});
