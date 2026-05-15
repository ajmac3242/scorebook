// frontend/src/tokens/typography.ts

export const fontFamily = {
  display: '"EB Garamond", "Playfair Display", Georgia, serif',
  body: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const fontSize = {
  xs: "0.75rem",     // 12
  sm: "0.875rem",    // 14
  md: "1rem",        // 16
  lg: "1.125rem",    // 18
  xl: "1.25rem",     // 20
  "2xl": "1.5rem",   // 24
  "3xl": "1.875rem", // 30
  "4xl": "2.25rem",  // 36
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.6,
  roomy: 1.75,
} as const;

export const letterSpacing = {
  tighter: "-0.02em",
  tight: "-0.01em",
  normal: "0.01em",
  wide: "0.02em",
  wider: "0.04em",
} as const;

export const textStyles = {
  displayLg: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize["4xl"],
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMd: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize["3xl"],
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize["2xl"],
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.tight,
  },
  headingLg: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  headingMd: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  headingSm: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  labelLg: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  labelSm: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
  stat: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.bold,
    fontSize: fontSize["2xl"],
    lineHeight: 1,
    letterSpacing: letterSpacing.tighter,
  },
  statLabel: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },
  button: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
    lineHeight: 1.2,
    letterSpacing: letterSpacing.normal,
    textTransform: "none" as const,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontWeight: fontWeight.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    letterSpacing: "0",
  },
} as const;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
};

export type AppTypography = typeof typography;
