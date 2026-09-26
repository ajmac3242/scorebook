import { describe, it, expect } from "vitest";
import cssVariables, { generateCssVariables } from "./cssVariables";
import { tokens } from "./tokens/tokens";

describe("cssVariables", () => {
  it("flattens a nested token object into CSS custom property key-value pairs", () => {
    const input = {
      semantic: {
        color: {
          brand: {
            primary: {
              main: "#00C9E0",
            },
          },
        },
      },
      spacing: {
        unit: 8,
      },
    };

    const vars = generateCssVariables(input);

    expect(vars["--cs-semantic-color-brand-primary-main"]).toBe("#00C9E0");
    expect(vars["--cs-spacing-unit"]).toBe(8);
  });

  it("supports custom CSS prefix", () => {
    const input = {
      brand: {
        primary: "#123456",
      },
    };

    const vars = generateCssVariables(input, "--custom");
    expect(vars["--custom-brand-primary"]).toBe("#123456");
  });

  it("handles null values, arrays, and skips easing objects from recursive flattening", () => {
    const input = {
      nullVal: null,
      arrayVal: [1, 2, 3],
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      valid: "test",
    };

    const vars = generateCssVariables(input as Record<string, unknown>);

    expect(vars["--cs-valid"]).toBe("test");
    expect(vars["--cs-nullVal"]).toBeUndefined();
    expect(vars["--cs-arrayVal"]).toBeUndefined();
    expect(vars["--cs-easing"]).toBeUndefined();
  });

  it("generates cssVariables dictionary from AppTokens", () => {
    const result = cssVariables(tokens);

    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBeGreaterThan(0);
    expect(result["--cs-semantic-color-brand-primary-main"]).toBe(
      tokens.semantic.color.brand.primary.main,
    );
  });
});
