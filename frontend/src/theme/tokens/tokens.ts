import { colorSchemes } from "./colorSchemes";
import { motion } from "./motion";
import { typography } from "./typography";
import { layout } from "./layout";
import { componentSize } from "./componentSize";
import { radii } from "./radii";
import { touch } from "./touch";
import { cssVars } from "./cssVars";
import { breakpoints } from "./breakpoints";

export const tokens = {
  colorSchemes,
  motion,
  typography,
  layout: {
    ...layout,
    pageMaxWidth: 1280,
    pagePanelPadding: 32,
    pagePanelPaddingMobile: 20,
    pageSectionGap: 24,
    sectionCardPadding: 24,
    sectionCardPaddingCompact: 20,
    settingsRowMinHeight: 72,
    subnavHeight: 52,
  },
  componentSize,
  radii,
  touch,
  cssVars,
  breakpoints,
  semantic: {
    color: {
      brand: {
        primary: colorSchemes.classic.brand.primary,
        primaryLight: colorSchemes.classic.brand.primaryLight,
        primaryDark: colorSchemes.classic.brand.primaryDark,
        secondary: colorSchemes.classic.brand.secondary,
      },
      background: {
        default: colorSchemes.classic.background.default,
        paper: colorSchemes.classic.background.paper,
        subtle: colorSchemes.classic.background.subtle,
      },
      surface: {
        elevated: colorSchemes.classic.surface.elevated,
        sunken: colorSchemes.classic.surface.sunken,
      },
      text: {
        primary: colorSchemes.classic.text.primary,
        secondary: colorSchemes.classic.text.secondary,
        inverse: colorSchemes.classic.text.inverse,
        disabled: colorSchemes.classic.text.disabled,
      },
      border: {
        subtle: colorSchemes.classic.border.subtle,
        default: colorSchemes.classic.border.default,
        strong: colorSchemes.classic.border.strong,
        focus: colorSchemes.classic.border.focus,
      },
      action: {
        hover: colorSchemes.classic.action.hover,
        selected: colorSchemes.classic.action.selected,
        disabled: colorSchemes.classic.action.disabled,
        disabledBackground: colorSchemes.classic.action.disabledBackground,
      },
      feedback: {
        success: colorSchemes.classic.feedback.success,
        error: colorSchemes.classic.feedback.error,
        warning: colorSchemes.classic.feedback.warning,
        info: colorSchemes.classic.feedback.info,
      },
    },
    typography: {
      button: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        letterSpacing: "0",
        textTransform: "none" as const,
      },
      pageTitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize["2xl"],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
      },
      sectionTitle: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: 1.35,
        letterSpacing: "-0.01em",
      },
      supportingText: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.regular,
        lineHeight: 1.6,
        letterSpacing: "0",
      },
      eyebrowLabel: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: 1.4,
        letterSpacing: "0",
      },
    },
    component: {
      radius: {
        card: radii.lg,
        dialog: radii.xl,
        button: radii.md,
        input: radii.md,
        chip: radii.full,
      },
      border: {
        card: `1px solid ${colorSchemes.classic.border.subtle}`,
        divider: `1px solid ${colorSchemes.classic.border.subtle}`,
      },
      shadow: {
        card: "none",
        floating: "0 16px 40px rgba(16, 24, 40, 0.08)",
        topBar: "none",
      },
      pageShell: {
        radius: radii.xl,
        border: `1px solid ${colorSchemes.classic.border.subtle}`,
        shadow: "none",
        background: colorSchemes.classic.background.paper,
      },
      sectionCard: {
        radius: radii.lg,
        border: `1px solid ${colorSchemes.classic.border.subtle}`,
        shadow: "none",
        background: colorSchemes.classic.background.paper,
      },
      subnavTab: {
        height: 52,
        radius: 0,
        indicatorHeight: 2,
      },
      selectionCard: {
        radius: radii.lg,
        previewRadius: radii.md,
        borderWidth: 1,
        selectedBorderWidth: 2,
      },
    },
  },
} as const;

export type AppTokens = typeof tokens;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K] extends number
      ? number
      : T[K] extends string
        ? string
        : T[K] extends boolean
          ? boolean
          : T[K];
};

export interface ThemePreset {
  id: string;
  label: string;
  previewColor: string;
  mode: "light" | "dark";
  overrides?: DeepPartial<AppTokens>;
}
