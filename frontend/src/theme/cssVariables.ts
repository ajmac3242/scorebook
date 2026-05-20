import type { AppTokens } from "./tokens/tokens";

/**
 * Flattens the token object into a flat map of CSS variables.
 * E.g., { semantic: { color: { primary: { main: '#fff' } } } }
 * becomes { '--cs-semantic-color-primary-main': '#fff' }
 */
export function generateCssVariables(
  obj: any,
  prefix = "--cs",
): Record<string, string | number> {
  const vars: Record<string, string | number> = {};

  const flatten = (current: any, path: string) => {
    for (const key in current) {
      const value = current[key];
      const newPath = path ? `${path}-${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        // Don't flatten typography/shadow objects if they are used as multi-value CSS props
        // But for this app, we want to flatten everything to have granular control
        key !== "easing" // keep easing as is if it was an object, but it's a string
      ) {
        flatten(value, newPath);
      } else {
        vars[`${prefix}-${newPath}`] = value;
      }
    }
  };

  flatten(obj, "");
  return vars;
}

export const cssVariables = (tokens: AppTokens) => generateCssVariables(tokens);

export default cssVariables;
