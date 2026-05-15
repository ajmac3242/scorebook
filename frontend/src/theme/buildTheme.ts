import { createTheme, alpha, Theme, ThemeOptions } from "@mui/material/styles";
import { cssVariables } from "./cssVariables";
import { muiBreakpointValues } from "./tokens/breakpoints";
import {
  tokens,
  type AppTokens,
  type DeepPartial,
  type ThemePreset,
} from "./tokens/tokens";

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
        ":root": cssVariables(activeTokens.cssVars),
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
          paddingTop: "env(safe-area-inset-top)",
          paddingRight: "env(safe-area-inset-right)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        },
        "#root": {
          minHeight: "100dvh",
          backgroundColor: activeTokens.semantic.color.background.default,
        },
        "*": { boxSizing: "border-box" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: activeTokens.semantic.color.background.paper,
          color: activeTokens.semantic.color.text.primary,
          boxShadow: activeTokens.component.shadow.topBar,
          borderBottom: activeTokens.component.border.divider,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: activeTokens.semantic.color.background.paper,
        },
        rounded: { borderRadius: activeTokens.component.radius.card },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: activeTokens.component.radius.card,
          border: activeTokens.component.border.card,
          boxShadow: activeTokens.component.shadow.card,
          backgroundColor: activeTokens.semantic.color.surface.elevated,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: activeTokens.touch.targetComfortable,
          borderRadius: activeTokens.component.radius.button,
          paddingInline: activeTokens.layout.inlineGap * 1.5,
          paddingBlock: activeTokens.layout.inlineGap,
          fontFamily: activeTokens.semantic.typography.button.fontFamily,
          fontSize: activeTokens.semantic.typography.button.fontSize,
          fontWeight: activeTokens.semantic.typography.button.fontWeight,
          letterSpacing: activeTokens.semantic.typography.button.letterSpacing,
          textTransform: activeTokens.semantic.typography.button.textTransform,
          transition: [
            `background-color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `border-color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `color ${activeTokens.motion.duration.normal} ${activeTokens.motion.easing.productive}`,
            `transform ${activeTokens.motion.duration.fast} ${activeTokens.motion.easing.productive}`,
          ].join(", "),
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(0)" },
          "&.Mui-disabled": {
            color: activeTokens.semantic.color.action.disabled,
            backgroundColor:
              activeTokens.semantic.color.action.disabledBackground,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: activeTokens.touch.iconButtonMin,
          minHeight: activeTokens.touch.iconButtonMin,
          borderRadius: activeTokens.radii.pill,
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
          borderRadius: activeTokens.component.radius.chip,
          fontWeight: activeTokens.typography.fontWeight.medium,
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.layout.inputHeightMd,
          borderRadius: activeTokens.component.radius.input,
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
          paddingBlock: activeTokens.layout.inlineGap,
          paddingInline: activeTokens.layout.inlineGapTight * 2,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: activeTokens.semantic.color.text.secondary },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          width: "100%",
          borderRadius: activeTokens.component.radius.dialog,
          border: activeTokens.component.border.card,
          boxShadow: activeTokens.component.shadow.floating,
          margin: activeTokens.layout.pagePaddingX,
          maxWidth: activeTokens.componentSize.modalMaxWidthTablet,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: activeTokens.layout.dialogPadding } },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: activeTokens.semantic.color.border.subtle },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.touch.targetComfortable,
          borderRadius: activeTokens.radii.md,
          "&:hover": {
            backgroundColor: activeTokens.semantic.color.action.hover,
          },
          "&.Mui-selected": {
            backgroundColor: activeTokens.semantic.color.action.selected,
            "&:hover": {
              backgroundColor: alpha(
                activeTokens.semantic.color.brand.primary,
                0.14,
              ),
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.componentSize.segmentedControlHeight,
          textTransform: "none",
          fontWeight: activeTokens.typography.fontWeight.medium,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: activeTokens.semantic.color.border.subtle },
        head: {
          color: activeTokens.semantic.color.text.secondary,
          fontWeight: activeTokens.typography.fontWeight.semibold,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: activeTokens.radii.sm,
          backgroundColor: activeTokens.semantic.color.text.primary,
          color: activeTokens.semantic.color.text.inverse,
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

  return createTheme({
    breakpoints: { values: muiBreakpointValues },
    spacing: (factor: number) => `${4 * factor}px`,
    shape: { borderRadius: activeTokens.radii.md },

    palette: {
      mode: preset?.mode ?? "light",
      primary: {
        main: activeTokens.semantic.color.brand.primary,
        light: activeTokens.semantic.color.brand.primaryLight,
        dark: activeTokens.semantic.color.brand.primaryDark,
        contrastText: activeTokens.semantic.color.text.inverse,
      },
      secondary: {
        main: activeTokens.semantic.color.brand.secondary,
        light: activeTokens.semantic.color.brand.secondary,
        dark: activeTokens.semantic.color.brand.secondary,
        contrastText: activeTokens.semantic.color.text.inverse,
      },
      success: {
        main: activeTokens.semantic.color.feedback.success.main,
        light: activeTokens.semantic.color.feedback.success.light,
        dark: activeTokens.semantic.color.feedback.success.dark,
        contrastText: activeTokens.semantic.color.feedback.success.contrastText,
      },
      error: {
        main: activeTokens.semantic.color.feedback.error.main,
        light: activeTokens.semantic.color.feedback.error.light,
        dark: activeTokens.semantic.color.feedback.error.dark,
        contrastText: activeTokens.semantic.color.feedback.error.contrastText,
      },
      warning: {
        main: activeTokens.semantic.color.feedback.warning.main,
        light: activeTokens.semantic.color.feedback.warning.light,
        dark: activeTokens.semantic.color.feedback.warning.dark,
        contrastText: activeTokens.semantic.color.feedback.warning.contrastText,
      },
      info: {
        main: activeTokens.semantic.color.feedback.info.main,
        light: activeTokens.semantic.color.feedback.info.light,
        dark: activeTokens.semantic.color.feedback.info.dark,
        contrastText: activeTokens.semantic.color.feedback.info.contrastText,
      },
      background: {
        default: activeTokens.semantic.color.background.default,
        paper: activeTokens.semantic.color.background.paper,
      },
      text: {
        primary: activeTokens.semantic.color.text.primary,
        secondary: activeTokens.semantic.color.text.secondary,
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

    typography: {
      fontFamily: activeTokens.typography.fontFamily.body,
      h1: {
        ...activeTokens.semantic.typography.titleLg,
        color: activeTokens.semantic.color.text.primary,
      },
      h2: {
        ...activeTokens.semantic.typography.titleMd,
        color: activeTokens.semantic.color.text.primary,
      },
      h3: {
        ...activeTokens.semantic.typography.titleSm,
        color: activeTokens.semantic.color.text.primary,
      },
      h4: {
        ...activeTokens.semantic.typography.sectionTitle,
        color: activeTokens.semantic.color.text.primary,
      },
      h5: {
        ...activeTokens.semantic.typography.cardTitle,
        color: activeTokens.semantic.color.text.primary,
      },
      h6: {
        ...activeTokens.semantic.typography.cardTitle,
        color: activeTokens.semantic.color.text.primary,
      },
      body1: {
        ...activeTokens.semantic.typography.bodyMd,
        color: activeTokens.semantic.color.text.primary,
      },
      body2: {
        ...activeTokens.semantic.typography.bodySm,
        color: activeTokens.semantic.color.text.secondary,
      },
      button: { ...activeTokens.semantic.typography.button },
      subtitle1: {
        ...activeTokens.semantic.typography.sectionTitle,
        color: activeTokens.semantic.color.text.primary,
      },
      subtitle2: {
        ...activeTokens.semantic.typography.labelMd,
        color: activeTokens.semantic.color.text.secondary,
      },
      caption: {
        ...activeTokens.semantic.typography.labelSm,
        color: activeTokens.semantic.color.text.tertiary,
      },
      overline: {
        ...activeTokens.semantic.typography.labelSm,
        color: activeTokens.semantic.color.text.secondary,
        textTransform: "uppercase",
      },
    },

    components: buildComponentTheme(activeTokens),
  });
}

export default buildTheme;
