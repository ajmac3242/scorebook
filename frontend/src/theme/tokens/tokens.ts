// frontend/src/tokens/tokens.ts

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
    hover: 1.05,
    press: 0.95,
    iconHover: 1.1,
  },
} as const;

export const borders = {
  subtle: `1px solid ${palette.surfaces.border}`,
  default: `1px solid ${palette.surfaces.border}`,
  strong: `1px solid ${palette.surfaces.borderStrong}`,
  accent: `1px solid ${palette.brand.primary.main}`,
  focus: `3px solid ${palette.focus.ring}`,
} as const;

export const semantic = {
  color: {
    brand: {
      primary: palette.brand.primary.main,
      primaryLight: palette.brand.primary.light,
      primaryDark: palette.brand.primary.dark,
      secondary: palette.brand.secondary.main,
    },
    text: {
      heading: palette.text.heading,
      primary: palette.text.primary,
      body: palette.text.body,
      secondary: palette.text.secondary,
      muted: palette.text.muted,
      inverse: palette.text.inverse,
    },
    surface: {
      canvas: palette.surfaces.canvas,
      app: palette.surfaces.app,
      paper: palette.surfaces.paper,
      subtle: palette.surfaces.subtle,
      muted: palette.surfaces.muted,
    },
    border: {
      subtle: palette.surfaces.border,
      strong: palette.surfaces.borderStrong,
      focus: palette.focus.ring,
    },
    feedback: {
      success: palette.brand.success.main,
      error: palette.brand.error.main,
      warning: palette.brand.warning.main,
      info: palette.brand.info.main,
    },
  },
  typography: {
    display: typography.textStyles.displayMd,
    pageTitle: typography.textStyles.displaySm,
    sectionTitle: typography.textStyles.headingLg,
    panelTitle: typography.textStyles.headingMd,
    cardTitle: typography.textStyles.headingSm,
    body: typography.textStyles.bodyMd,
    bodySmall: typography.textStyles.bodySm,
    label: typography.textStyles.labelLg,
    labelSmall: typography.textStyles.labelSm,
    stat: typography.textStyles.stat,
    statLabel: typography.textStyles.statLabel,
    button: typography.textStyles.button,
    code: typography.textStyles.code,
  },
  layout: {
    pagePaddingX: layout.pagePaddingX,
    pagePaddingXWide: layout.pagePaddingXWide,
    pagePaddingY: layout.pagePaddingY,
    sectionGap: layout.sectionGap,
    panelGap: layout.panelGap,
    gridGap: layout.gridGap,
    stackGap: layout.stackGap,
    inlineGap: layout.inlineGap,
    cardPaddingCompact: layout.cardPaddingCompact,
    cardPadding: layout.cardPadding,
    cardPaddingLarge: layout.cardPaddingLarge,
    dialogPadding: layout.dialogPadding,
  },
  component: {
    radius: {
      input: radii.md,
      card: radii.md,
      dialog: radii.lg,
      button: radii.md,
      chip: radii.pill,
    },
    shadow: {
      card: shadows.md,
      floating: shadows.lg,
      topBar: shadows.sm,
      hover: shadows.lg,
    },
    border: {
      card: borders.default,
      input: borders.default,
      divider: borders.subtle,
      focus: borders.focus,
    },
  },
  texture: {
    paperDotColor: palette.paperGrid.dot,
    paperDotBackground: palette.paperGrid.background,
    paperDotSize: layout.dottedGridSize,
    paperDotRadius: layout.dottedGridDot,
  },
} as const;

export const cssVars = {
  "--color-brand-primary": semantic.color.brand.primary,
  "--color-brand-primary-light": semantic.color.brand.primaryLight,
  "--color-brand-primary-dark": semantic.color.brand.primaryDark,
  "--color-brand-secondary": semantic.color.brand.secondary,

  "--color-text-heading": semantic.color.text.heading,
  "--color-text-primary": semantic.color.text.primary,
  "--color-text-body": semantic.color.text.body,
  "--color-text-secondary": semantic.color.text.secondary,
  "--color-text-muted": semantic.color.text.muted,
  "--color-text-inverse": semantic.color.text.inverse,

  "--color-surface-canvas": semantic.color.surface.canvas,
  "--color-surface-app": semantic.color.surface.app,
  "--color-surface-paper": semantic.color.surface.paper,
  "--color-surface-subtle": semantic.color.surface.subtle,
  "--color-surface-muted": semantic.color.surface.muted,

  "--color-border-subtle": semantic.color.border.subtle,
  "--color-border-strong": semantic.color.border.strong,
  "--color-border-focus": semantic.color.border.focus,

  "--color-feedback-success": semantic.color.feedback.success,
  "--color-feedback-error": semantic.color.feedback.error,
  "--color-feedback-warning": semantic.color.feedback.warning,
  "--color-feedback-info": semantic.color.feedback.info,

  "--font-display": typography.fontFamily.display,
  "--font-body": typography.fontFamily.body,
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

  "--paper-grid-size": `${semantic.texture.paperDotSize}px`,
  "--paper-grid-dot": `${semantic.texture.paperDotRadius}px`,
  "--paper-grid-dot-color": semantic.texture.paperDotColor,
  "--paper-grid-bg": semantic.texture.paperDotBackground,
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

export type ThemePreset = {
  id: string;
  label: string;
  previewColor: string;
  mode: "light" | "dark";
  tokens: AppTokens;
};
