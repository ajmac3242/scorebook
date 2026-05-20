import type { AppTokens } from "./tokens/tokens";

/**
 * Flattens the token object into a flat map of CSS variables.
 * E.g., { semantic: { color: { primary: { main: '#fff' } } } }
 * becomes { '--cs-semantic-color-primary-main': '#fff' }
 */
export function generateCssVariables(
  obj: Record<string, unknown>,
  prefix = "--cs",
): Record<string, string | number> {
  const vars: Record<string, string | number> = {};

  const flatten = (current: Record<string, unknown>, path: string) => {
    for (const key in current) {
      const value = current[key];
      const newPath = path ? `${path}-${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        key !== "easing"
      ) {
        flatten(value as Record<string, unknown>, newPath);
      } else if (typeof value === "string" || typeof value === "number") {
        vars[`${prefix}-${newPath}`] = value;
      }
    }
  };

  flatten(obj, "");
  return vars;
}

export const cssVariables = (tokens: AppTokens) =>
  generateCssVariables(tokens as unknown as Record<string, unknown>);

export default cssVariables;
