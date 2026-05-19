import {
  alpha,
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

const muiBreakpointValues = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

/**
 *
 * @param value
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 *
 * @param base
 * @param override
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
 * @param preset
 */
export function resolveTokens(preset?: ThemePreset): AppTokens {
  return deepMerge(tokens, preset?.overrides);
}

/**
 *
 * @param activeTokens
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
          boxShadow: activeTokens.semantic.component.shadow.topBar,
          borderBottom: activeTokens.semantic.component.border.divider,
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
          borderRadius: activeTokens.semantic.component.sectionCard.radius,
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: activeTokens.semantic.component.selectionCard.radius,
          border: activeTokens.semantic.component.border.card,
          boxShadow: activeTokens.semantic.component.shadow.card,
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
          borderRadius: activeTokens.semantic.component.radius.button,
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
            boxShadow: "none",
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
            backgroundColor: activeTokens.semantic.color.background.subtle,
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
          borderRadius: activeTokens.semantic.component.radius.chip,
          fontWeight: activeTokens.typography.fontWeight.medium,
          backgroundColor: activeTokens.semantic.color.background.paper,
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.settings.tabs.height,
        },

        indicator: {
          display: "none",
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: activeTokens.settings.tabs.height,
          paddingInline: activeTokens.settings.tabs.paddingX,
          paddingBlock: 8,
          borderRadius: activeTokens.settings.tabs.radius,
          textTransform: "none",
          minWidth: 0,
          color: activeTokens.settings.tabs.inactiveColor,
          fontSize: activeTokens.semantic.typography.supportingText.fontSize,
          fontWeight: activeTokens.typography.fontWeight.medium,
          transition: "background-color 180ms ease, color 180ms ease",
          "&:hover": {
            backgroundColor: activeTokens.settings.tabs.hoverBackground,
          },
          "&.Mui-selected": {
            color: activeTokens.settings.tabs.activeColor,
            backgroundColor: activeTokens.settings.tabs.activeBackground,
          },
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
          borderRadius: activeTokens.semantic.component.radius.input,
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

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: activeTokens.semantic.color.text.secondary,
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: {
          display: "flex",
          alignItems: "center",
          minHeight: "unset",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          width: "100%",
          borderRadius: activeTokens.semantic.component.radius.dialog,
          border: activeTokens.semantic.component.border.card,
          boxShadow: activeTokens.semantic.component.shadow.floating,
          margin: activeTokens.layout.pagePaddingX,
          maxWidth: activeTokens.componentSize.modalMaxWidthTablet,
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

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: activeTokens.semantic.color.border.subtle,
        },
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
 * @param preset
 */
export function buildTheme(preset?: ThemePreset): Theme {
  const activeTokens = resolveTokens(preset);

  return createTheme({
    breakpoints: {
      values: muiBreakpointValues,
    },

    spacing: (factor: number) => `${4 * factor}px`,

    shape: {
      borderRadius: activeTokens.radii.md,
    },

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

    typography: {
      fontFamily: activeTokens.typography.fontFamily.body,
      h1: {
        fontFamily: activeTokens.typography.fontFamily.display,
        fontSize: activeTokens.typography.fontSize["4xl"],
        fontWeight: activeTokens.typography.fontWeight.bold,
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: activeTokens.typography.fontFamily.display,
        fontSize: activeTokens.typography.fontSize["3xl"],
        fontWeight: activeTokens.typography.fontWeight.bold,
        lineHeight: 1.15,
      },
      h3: {
        fontFamily: activeTokens.typography.fontFamily.display,
        fontSize: activeTokens.typography.fontSize["2xl"],
        fontWeight: activeTokens.typography.fontWeight.semibold,
        lineHeight: 1.2,
      },
      h4: {
        fontFamily: activeTokens.typography.fontFamily.body,
        fontSize: activeTokens.typography.fontSize.xl,
        fontWeight: activeTokens.typography.fontWeight.semibold,
        lineHeight: 1.25,
      },
      h5: {
        fontFamily: activeTokens.semantic.typography.pageTitle.fontFamily,
        fontSize: activeTokens.semantic.typography.pageTitle.fontSize,
        fontWeight: activeTokens.semantic.typography.pageTitle.fontWeight,
        lineHeight: activeTokens.semantic.typography.pageTitle.lineHeight,
        letterSpacing: activeTokens.semantic.typography.pageTitle.letterSpacing,
      },
      h6: {
        fontFamily: activeTokens.semantic.typography.sectionTitle.fontFamily,
        fontSize: activeTokens.semantic.typography.sectionTitle.fontSize,
        fontWeight: activeTokens.semantic.typography.sectionTitle.fontWeight,
        lineHeight: activeTokens.semantic.typography.sectionTitle.lineHeight,
        letterSpacing:
          activeTokens.semantic.typography.sectionTitle.letterSpacing,
      },
      body1: {
        fontFamily: activeTokens.typography.fontFamily.body,
        fontSize: activeTokens.typography.fontSize.md,
        fontWeight: activeTokens.typography.fontWeight.regular,
        lineHeight: 1.6,
      },
      body2: {
        fontFamily: activeTokens.semantic.typography.supportingText.fontFamily,
        fontSize: activeTokens.semantic.typography.supportingText.fontSize,
        fontWeight: activeTokens.semantic.typography.supportingText.fontWeight,
        lineHeight: activeTokens.semantic.typography.supportingText.lineHeight,
        letterSpacing:
          activeTokens.semantic.typography.supportingText.letterSpacing,
      },
      caption: {
        fontFamily: activeTokens.typography.fontFamily.body,
        fontSize: activeTokens.typography.fontSize.xs,
        fontWeight: activeTokens.typography.fontWeight.medium,
        lineHeight: 1.4,
      },
      button: {
        fontFamily: activeTokens.semantic.typography.button.fontFamily,
        fontSize: activeTokens.semantic.typography.button.fontSize,
        fontWeight: activeTokens.semantic.typography.button.fontWeight,
        letterSpacing: activeTokens.semantic.typography.button.letterSpacing,
        textTransform: activeTokens.semantic.typography.button.textTransform,
      },
    },

    components: buildComponentTheme(activeTokens),
  });
}

export default buildTheme;
