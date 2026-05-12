import type { ThemeOptions } from "@mui/material/styles";
import type { ThemeTokens } from "./tokens";

/**
 * getComponentOverrides
 *
 * Extracts complex component styling logic to keep buildTheme.ts concise.
 */
export function getComponentOverrides(
  tokens: ThemeTokens,
  mode: "light" | "dark",
): ThemeOptions["components"] {
  return {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { background-color: ${tokens.background}; transition: background-color 0.3s ease; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${tokens.background}; }
        ::-webkit-scrollbar-thumb { background: ${tokens.outline}; border-radius: 4px; }
      `,
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          transition: "all 0.2s ease-in-out",
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(1px)" },
          "&.Mui-focusVisible": {
            outline: `2px solid ${tokens.primary}`,
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.1)",
            backgroundColor: tokens.surfaceVariant,
          },
          "&:active": { transform: "scale(0.95)" },
          "&.Mui-focusVisible": {
            outline: `2px solid ${tokens.primary}`,
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          borderRadius: 12,
          border: `1px solid ${tokens.outline}`,
          boxShadow: "none",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow:
              mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.4)"
                : "0 8px 24px rgba(0,0,0,0.08)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface,
          color: tokens.textPrimary,
          borderBottom: `1px solid ${tokens.outline}`,
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        elevation1: { backgroundColor: tokens.surface },
        elevation2: { backgroundColor: tokens.elevatedCard },
      },
    },
  };
}
