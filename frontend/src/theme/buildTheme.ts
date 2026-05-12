import { createTheme, Theme } from "@mui/material/styles";
import type { ThemeTokens } from "./tokens";
import { getComponentOverrides } from "./overrides";

/**
 * buildCourtSightTheme
 *
 * DESIGN-001-B: MUI Theme Builder Function
 *
 * Translates CourtSight design tokens into a functional MUI Theme object.
 */
export function buildCourtSightTheme(tokens: ThemeTokens): Theme {
  const mode = tokens.mode || "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        dark: tokens.primaryDark,
        contrastText: tokens.onPrimary,
      },
      secondary: { main: tokens.textSecondary },
      background: { default: tokens.background, paper: tokens.surface },
      text: { primary: tokens.textPrimary, secondary: tokens.textSecondary },
      divider: tokens.outline,
      success: { main: tokens.success },
      warning: { main: tokens.warning },
      error: { main: tokens.error },
      info: { main: tokens.info },
      action: {
        selected: tokens.primaryContainer,
        hover: tokens.surfaceVariant,
      },
    },
    typography: {
      fontFamily: '"Inter", "system-ui", "-apple-system", "sans-serif"',
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.01em" },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      subtitle1: { fontFeatureSettings: '"tnum"' },
      subtitle2: { fontFeatureSettings: '"tnum"' },
      caption: { fontFeatureSettings: '"tnum"' },
    },
    shape: { borderRadius: 8 },
    components: getComponentOverrides(tokens, mode),
  });
}
