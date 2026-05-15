import { palette } from "./palette";
import { spacing, space, layout } from "./spacing";
import { typography } from "./typography";

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
  round: 9999,
} as const;

export const shadows = {
  none: "none",
  xs: "0px 1px 2px rgba(0, 0, 0, 0.04)",
  sm: "0px 2px 4px rgba(0, 0, 0, 0.06)",
  md: "0px 4px 12px rgba(0, 0, 0, 0.05)",
  lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.02)",
  xl: "0px 16px 32px rgba(2, 50, 70, 0.10)",
} as const;

export const motion = {
  duration: {
    instant: "0ms",
    fast: "120ms",
    normal: "200ms",
    slow: "320ms",
  },
  easing: {
    standard: "ease",
    productive: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  scale: {
    hover: 1.02,
    press: 0.98,
    iconHover: 1.06,
  },
} as const;

export const borders = {
  subtle: `1px solid ${palette.border.subtle}`,
  default: `1px solid ${palette.border.default}`,
  strong: `1px solid ${palette.border.strong}`,
  accent: `1px solid ${palette.border.accent}`,
  focus: `3px solid ${palette.action.focusRing}`,
} as const;

export const semantic = {
  color: {
    brand: {
      primary: palette.brand.primary.main,
      primaryLight: palette.brand.primary.light,
      primaryDark: palette.brand.primary.dark,
      secondary: palette.brand.secondary.main,
    },
    background: {
      default: palette.background.default,
      subtle: palette.background.subtle,
      paper: palette.background.paper,
      elevated: palette.background.elevated,
      inset: palette.background.inset,
    },
    surface: {
      default: palette.surface.default,
      subtle: palette.surface.subtle,
      elevated: palette.surface.elevated,
      inset: palette.surface.inset,
      strong: palette.surface.strong,
      accentSoft: palette.surface.accentSoft,
    },
    text: {
      primary: palette.text.primary,
      secondary: palette.text.secondary,
      tertiary: palette.text.tertiary,
      muted: palette.text.muted,
      inverse: palette.text.inverse,
    },
    border: {
      subtle: palette.border.subtle,
      default: palette.border.default,
      strong: palette.border.strong,
      accent: palette.border.accent,
      focus: palette.action.focusRing,
    },
    action: {
      hover: palette.action.hover,
      selected: palette.action.selected,
      disabled: palette.action.disabled,
      disabledBackground: palette.action.disabledBackground,
      focusRing: palette.action.focusRing,
    },
    feedback: {
      success: palette.brand.success.main,
      error: palette.brand.error.main,
      warning: palette.brand.warning.main,
      info: palette.brand.info.main,
    },
  },
  typography: {
    titleLg: typography.textStyles.titleLg,
    titleMd: typography.textStyles.titleMd,
    titleSm: typography.textStyles.titleSm,
    sectionTitle: typography.textStyles.sectionTitle,
    cardTitle: typography.textStyles.cardTitle,
    bodyLg: typography.textStyles.bodyLg,
    bodyMd: typography.textStyles.bodyMd,
    bodySm: typography.textStyles.bodySm,
    labelMd: typography.textStyles.labelMd,
    labelSm: typography.textStyles.labelSm,
    metric: typography.textStyles.metric,
    metricLabel: typography.textStyles.metricLabel,
    button: typography.textStyles.button,
    code: typography.textStyles.code,
    editorialAccent: typography.textStyles.editorialAccent,
  },
  layout: {
    pagePaddingX: layout.pagePaddingX,
    pagePaddingXWide: layout.pagePaddingXWide,
    pagePaddingY: layout.pagePaddingY,
    sectionGap: layout.sectionGap,
    panelGap: layout.panelGap,
    gridGap: layout.gridGap,
    gridGapDense: layout.gridGapDense,
    stackGap: layout.stackGap,
    stackGapDense: layout.stackGapDense,
    inlineGap: layout.inlineGap,
    inlineGapTight: layout.inlineGapTight,
    cardPaddingCompact: layout.cardPaddingCompact,
    cardPadding: layout.cardPadding,
    cardPaddingLarge: layout.cardPaddingLarge,
    dialogPadding: layout.dialogPadding,
    controlGap: layout.controlGap,
    touchTargetMin: layout.touchTargetMin,
    inputHeightSm: layout.inputHeightSm,
    inputHeightMd: layout.inputHeightMd,
    inputHeightLg: layout.inputHeightLg,
  },
  component: {
    radius: {
      input: radii.md,
      card: radii.lg,
      dialog: radii.lg,
      button: radii.md,
      chip: radii.pill,
    },
    shadow: {
      card: shadows.sm,
      floating: shadows.lg,
      topBar: shadows.sm,
      hover: shadows.md,
    },
    border: {
      card: borders.default,
      input: borders.default,
      divider: borders.subtle,
      focus: borders.focus,
    },
  },
} as const;

export const cssVars = {
  "--color-brand-primary": semantic.color.brand.primary,
  "--color-brand-primary-light": semantic.color.brand.primaryLight,
  "--color-brand-primary-dark": semantic.color.brand.primaryDark,
  "--color-brand-secondary": semantic.color.brand.secondary,

  "--color-background-default": semantic.color.background.default,
  "--color-background-subtle": semantic.color.background.subtle,
  "--color-background-paper": semantic.color.background.paper,
  "--color-background-elevated": semantic.color.background.elevated,
  "--color-background-inset": semantic.color.background.inset,

  "--color-surface-default": semantic.color.surface.default,
  "--color-surface-subtle": semantic.color.surface.subtle,
  "--color-surface-elevated": semantic.color.surface.elevated,
  "--color-surface-inset": semantic.color.surface.inset,
  "--color-surface-strong": semantic.color.surface.strong,
  "--color-surface-accent-soft": semantic.color.surface.accentSoft,

  "--color-text-primary": semantic.color.text.primary,
  "--color-text-secondary": semantic.color.text.secondary,
  "--color-text-tertiary": semantic.color.text.tertiary,
  "--color-text-muted": semantic.color.text.muted,
  "--color-text-inverse": semantic.color.text.inverse,

  "--color-border-subtle": semantic.color.border.subtle,
  "--color-border-default": semantic.color.border.default,
  "--color-border-strong": semantic.color.border.strong,
  "--color-border-accent": semantic.color.border.accent,
  "--color-border-focus": semantic.color.border.focus,

  "--color-action-hover": semantic.color.action.hover,
  "--color-action-selected": semantic.color.action.selected,
  "--color-action-disabled": semantic.color.action.disabled,
  "--color-action-disabled-bg": semantic.color.action.disabledBackground,

  "--color-feedback-success": semantic.color.feedback.success,
  "--color-feedback-error": semantic.color.feedback.error,
  "--color-feedback-warning": semantic.color.feedback.warning,
  "--color-feedback-info": semantic.color.feedback.info,

  "--font-body": typography.fontFamily.body,
  "--font-display": typography.fontFamily.display,
  "--font-accent": typography.fontFamily.accent,
  "--font-mono": typography.fontFamily.mono,

  "--font-size-xs": typography.fontSize.xs,
  "--font-size-sm": typography.fontSize.sm,
  "--font-size-md": typography.fontSize.md,
  "--font-size-lg": typography.fontSize.lg,
  "--font-size-xl": typography.fontSize.xl,
  "--font-size-2xl": typography.fontSize["2xl"],
  "--font-size-3xl": typography.fontSize["3xl"],
  "--font-size-4xl": typography.fontSize["4xl"],

  "--space-0": `${spacing[0]}px`,
  "--space-1": `${spacing[1]}px`,
  "--space-2": `${spacing[2]}px`,
  "--space-3": `${spacing[3]}px`,
  "--space-4": `${spacing[4]}px`,
  "--space-5": `${spacing[5]}px`,
  "--space-6": `${spacing[6]}px`,
  "--space-8": `${spacing[8]}px`,
  "--space-10": `${spacing[10]}px`,
  "--space-12": `${spacing[12]}px`,
  "--space-16": `${spacing[16]}px`,

  "--radius-xs": `${radii.xs}px`,
  "--radius-sm": `${radii.sm}px`,
  "--radius-md": `${radii.md}px`,
  "--radius-lg": `${radii.lg}px`,
  "--radius-xl": `${radii.xl}px`,
  "--radius-pill": `${radii.pill}px`,

  "--shadow-xs": shadows.xs,
  "--shadow-sm": shadows.sm,
  "--shadow-md": shadows.md,
  "--shadow-lg": shadows.lg,
  "--shadow-xl": shadows.xl,

  "--motion-fast": motion.duration.fast,
  "--motion-normal": motion.duration.normal,
  "--motion-slow": motion.duration.slow,
  "--ease-standard": motion.easing.standard,
  "--ease-productive": motion.easing.productive,
  "--ease-emphasized": motion.easing.emphasized,
} as const;

export const tokens = {
  palette,
  spacing,
  space,
  layout,
  typography,
  radii,
  shadows,
  motion,
  borders,
  semantic,
  cssVars,
} as const;

export type AppTokens = typeof tokens;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type ThemePreset = {
  id: string;
  label: string;
  previewColor: string;
  mode: "light" | "dark";
  overrides?: DeepPartial<AppTokens>;
};
