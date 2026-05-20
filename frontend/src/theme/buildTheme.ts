import {
  createTheme,
  type Theme,
  type ThemeOptions,
} from "@mui/material/styles";
import { cssVariables } from "./cssVariables";
import {
  tokens,
  type AppTokens,
  type DeepPartial,
  type ThemePreset,
} from "./tokens/tokens";
import { muiBreakpointValues } from "./tokens/breakpoints";

/**
 *
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 *
 */
function deepMerge<T>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;

  const output: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };

  for (const key of Object.keys(override) as Array<keyof T>) {
    const baseValue = output[key as string];
    const overrideValue = override[key];

    if (overrideValue === undefined) continue;

    if (isObject(baseValue) && isObject(overrideValue)) {
      output[key as string] = deepMerge(baseValue, overrideValue);
    } else {
      output[key as string] = overrideValue as unknown;
    }
  }

  return output as T;
}

/**
 *
 */
export function resolveTokens(preset?: ThemePreset): AppTokens {
  return deepMerge(tokens, preset?.overrides);
}

/**
 *
 */
function buildComponentTheme(
  activeTokens: AppTokens,
): ThemeOptions["components"] {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": cssVariables(activeTokens),
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        body: {
          backgroundColor: activeTokens.semantic.color.background.default,
          color: activeTokens.semantic.color.text.primary,
          fontFamily: activeTokens.typography.fontFamily.body,
          overscrollBehavior: "none",
          margin: 0,
        },
        "#root": {
          minHeight: "100dvh",
          backgroundColor: activeTokens.semantic.color.background.default,
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: activeTokens.semantic.color.background.paper,
          color: activeTokens.semantic.color.text.primary,
          boxShadow: activeTokens.semantic.elevation.shadow.card,
          borderBottom: `1px solid ${activeTokens.semantic.color.border.subtle}`,
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: activeTokens.semantic.color.background.paper,
          borderColor: activeTokens.semantic.color.border.subtle,
        },
        rounded: {
          borderRadius: activeTokens.semantic.shape.radius.lg,
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: activeTokens.semantic.shape.radius.lg,
          border: `1px solid ${activeTokens.semantic.color.border.subtle}`,
          boxShadow: activeTokens.semantic.elevation.shadow.card,
          backgroundColor: activeTokens.semantic.color.background.paper,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: activeTokens.touch.targetComfortable,
          borderRadius: activeTokens.semantic.shape.radius.md,
          paddingInline: 14,
          paddingBlock: 8,
          fontFamily: activeTokens.semantic.typography.button.fontFamily,
          fontSize: activeTokens.semantic.typography.button.fontSize,
          fontWeight: activeTokens.semantic.typography.button.fontWeight,
          letterSpacing: activeTokens.semantic.typography.button.letterSpacing,
          textTransform: activeTokens.semantic.typography.button.textTransform,
          boxShadow: "none",
          transition: [
            `background-color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `border-color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `transform ${activeTokens.motion.duration.fast} ${activeTokens.motion.easing.productive}`,
          ].join(", "),
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: activeTokens.semantic.elevation.shadow.card,
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            color: activeTokens.semantic.color.action.disabled,
            backgroundColor:
              activeTokens.semantic.color.action.disabledBackground,
          },
        },
        outlined: {
          borderColor: activeTokens.semantic.color.border.default,
          backgroundColor: activeTokens.semantic.color.background.paper,
          "&:hover": {
            borderColor: activeTokens.semantic.color.border.strong,
            backgroundColor: activeTokens.semantic.color.surface.subtle,
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: activeTokens.touch.iconButtonMin,
          minHeight: activeTokens.touch.iconButtonMin,
          borderRadius: activeTokens.semantic.shape.radius.full,
          transition: [
            `background-color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `transform ${activeTokens.motion.duration.fast} ${activeTokens.motion.easing.productive}`,
          ].join(", "),
          "&:hover": {
            backgroundColor: activeTokens.semantic.color.action.hover,
            transform: `scale(${activeTokens.motion.scale.iconHover})`,
          },
          "&:active": {
            transform: `scale(${activeTokens.motion.scale.press})`,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: activeTokens.semantic.shape.radius.full,
          fontWeight: activeTokens.typography.fontWeight.medium,
          backgroundColor: activeTokens.semantic.color.background.paper,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.layout.inputHeightMd,
          borderRadius: activeTokens.semantic.shape.radius.md,
          backgroundColor: activeTokens.semantic.color.background.paper,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: activeTokens.semantic.color.border.default,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: activeTokens.semantic.color.border.strong,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: activeTokens.semantic.color.border.focus,
            borderWidth: 2,
          },
          "&.Mui-disabled": {
            backgroundColor:
              activeTokens.semantic.color.action.disabledBackground,
          },
        },
        input: {
          paddingBlock: 10,
          paddingInline: 14,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          width: "100%",
          borderRadius: activeTokens.semantic.shape.radius.xl,
          border: `1px solid ${activeTokens.semantic.color.border.subtle}`,
          boxShadow: activeTokens.semantic.elevation.shadow.dialog,
          margin: 24,
          maxWidth: 720,
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: activeTokens.layout.dialogPadding,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: activeTokens.semantic.color.border.subtle,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: activeTokens.semantic.shape.radius.sm,
          backgroundColor: activeTokens.semantic.color.text.primary,
          color: activeTokens.semantic.color.text.inverse,
          boxShadow: activeTokens.semantic.elevation.shadow.tooltip,
        },
      },
    },
  };
}

/**
 *
 */
export function buildTheme(preset?: ThemePreset): Theme {
  const activeTokens = resolveTokens(preset);

  const theme = createTheme({
    cssVariables: {
      colorSchemeSelector: "class",
    },
    breakpoints: {
      values: muiBreakpointValues,
    },

    spacing: (factor: number) => `${4 * factor}px`,

    shape: {
      borderRadius: activeTokens.semantic.shape.radius.md,
    },

    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: activeTokens.semantic.color.brand.primary.main,
            light: activeTokens.semantic.color.brand.primary.light,
            dark: activeTokens.semantic.color.brand.primary.dark,
            contrastText:
              activeTokens.semantic.color.brand.primary.contrastText,
          },
          secondary: {
            main: activeTokens.semantic.color.brand.secondary.main,
            light: activeTokens.semantic.color.brand.secondary.light,
            dark: activeTokens.semantic.color.brand.secondary.dark,
            contrastText:
              activeTokens.semantic.color.brand.secondary.contrastText,
          },
          success: {
            main: activeTokens.semantic.color.feedback.success.main,
            light: activeTokens.semantic.color.feedback.success.light,
            dark: activeTokens.semantic.color.feedback.success.dark,
            contrastText:
              activeTokens.semantic.color.feedback.success.contrastText,
          },
          error: {
            main: activeTokens.semantic.color.feedback.error.main,
            light: activeTokens.semantic.color.feedback.error.light,
            dark: activeTokens.semantic.color.feedback.error.dark,
            contrastText:
              activeTokens.semantic.color.feedback.error.contrastText,
          },
          warning: {
            main: activeTokens.semantic.color.feedback.warning.main,
            light: activeTokens.semantic.color.feedback.warning.light,
            dark: activeTokens.semantic.color.feedback.warning.dark,
            contrastText:
              activeTokens.semantic.color.feedback.warning.contrastText,
          },
          info: {
            main: activeTokens.semantic.color.feedback.info.main,
            light: activeTokens.semantic.color.feedback.info.light,
            dark: activeTokens.semantic.color.feedback.info.dark,
            contrastText:
              activeTokens.semantic.color.feedback.info.contrastText,
          },
          background: {
            default: activeTokens.semantic.color.background.default,
            paper: activeTokens.semantic.color.background.paper,
          },
          text: {
            primary: activeTokens.semantic.color.text.primary,
            secondary: activeTokens.semantic.color.text.secondary,
            disabled: activeTokens.semantic.color.text.disabled,
          },
          divider: activeTokens.semantic.color.border.subtle,
          action: {
            hover: activeTokens.semantic.color.action.hover,
            selected: activeTokens.semantic.color.action.selected,
            disabled: activeTokens.semantic.color.action.disabled,
            disabledBackground:
              activeTokens.semantic.color.action.disabledBackground,
          },
        },
      },
      dark: {
        // Dark scheme can be defined if needed
      },
    },

    typography: {
      fontFamily: activeTokens.typography.fontFamily.body,
      h1: activeTokens.semantic.typography.h1,
      h2: activeTokens.semantic.typography.h2,
      h3: activeTokens.semantic.typography.h3,
      h4: activeTokens.semantic.typography.h4,
      h5: activeTokens.semantic.typography.h5,
      h6: activeTokens.semantic.typography.h6,
      body1: activeTokens.semantic.typography.body1,
      body2: activeTokens.semantic.typography.body2,
      caption: activeTokens.semantic.typography.caption,
      button: activeTokens.semantic.typography.button,
    },

    components: buildComponentTheme(activeTokens),
  });

  theme.appTokens = activeTokens;

  return theme;
}

export default buildTheme;
